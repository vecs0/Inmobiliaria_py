import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/config';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Error de escritura en DB → respondemos 500 para que Stripe reintente. */
class WebhookDbError extends Error {}

function check(error: { message: string } | null, ctx: string) {
  if (error) throw new WebhookDbError(`${ctx}: ${error.message}`);
}

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === 'string' ? v : v.id;
}

function toIso(unix: number | null | undefined): string | null {
  return unix ? new Date(unix * 1000).toISOString() : null;
}

/** Mapea estados de Stripe a seller_profiles.subscription_status (VARCHAR(20)). */
function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return status;
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'inactive';
    default:
      return 'incomplete';
  }
}

async function findSellerByCustomer(db: SupabaseClient, customerId: string | null) {
  if (!customerId) return null;
  const { data, error } = await db
    .from('seller_profiles')
    .select('id, user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  check(error, 'select seller_profiles by customer');
  return data as { id: string; user_id: string | null } | null;
}

async function applyPlan(
  db: SupabaseClient,
  userId: string,
  planId: number,
  subscriptionId: string | null,
  customerId: string | null,
) {
  const { data: plan, error: planErr } = await db
    .from('subscription_plans')
    .select('id, name, plan_type, max_properties, stripe_price_id')
    .eq('id', planId)
    .maybeSingle();
  check(planErr, 'select subscription_plans');

  const update: Record<string, unknown> = {
    subscription_status: 'active',
    stripe_subscription_id: subscriptionId,
    updated_at: new Date().toISOString(),
  };
  if (customerId) update.stripe_customer_id = customerId;
  if (plan) {
    update.subscription_plan = String(plan.name).toLowerCase().slice(0, 20);
    update.max_properties = plan.max_properties;
    update.stripe_price_id = plan.stripe_price_id;
  }

  const { error } = await db.from('seller_profiles').update(update).eq('user_id', userId);
  check(error, 'update seller_profiles (plan)');
}

// ── checkout.session.completed ──────────────────────────────────────────────
async function handleCheckoutCompleted(db: SupabaseClient, session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};

  if (meta.type === 'boost') {
    const boostId = meta.boost_id;
    const propertyId = meta.property_id;
    if (!boostId || !propertyId) return;
    if (session.payment_status !== 'paid') return;

    const days = Number.parseInt(meta.plan_days ?? '7', 10) || 7;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 86_400_000);

    const { error: bErr } = await db
      .from('property_boosts')
      .update({
        status: 'active',
        stripe_payment_intent: idOf(session.payment_intent),
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', boostId);
    check(bErr, 'update property_boosts');

    const { error: lErr } = await db.from('listings').update({ featured: true }).eq('id', propertyId);
    check(lErr, 'update listings.featured');
    return;
  }

  // Suscripción: el registro de pago lo crea invoice.paid (evita duplicados).
  if (session.mode === 'subscription') {
    const userId = meta.supabase_user_id;
    const planId = Number.parseInt(meta.plan_id ?? '', 10);
    if (!userId || !Number.isFinite(planId)) return;
    await applyPlan(db, userId, planId, idOf(session.subscription), idOf(session.customer));
  }
}

// ── invoice.paid / invoice.payment_succeeded ────────────────────────────────
async function handleInvoicePaid(db: SupabaseClient, invoice: Stripe.Invoice) {
  const subDetails = invoice.parent?.subscription_details ?? null;
  const subscriptionId = idOf(subDetails?.subscription ?? null);
  if (!subscriptionId) return; // no es factura de suscripción

  const customerId = idOf(invoice.customer);
  const meta = subDetails?.metadata ?? {};
  const seller = await findSellerByCustomer(db, customerId);
  const userId = meta.supabase_user_id ?? seller?.user_id ?? null;
  if (!userId) {
    console.warn(`[stripe] invoice ${invoice.id} sin seller asociado`);
    return;
  }

  const planId = Number.parseInt(meta.plan_id ?? '', 10);
  if (Number.isFinite(planId)) {
    await applyPlan(db, userId, planId, subscriptionId, customerId);
  } else {
    const { error } = await db
      .from('seller_profiles')
      .update({ subscription_status: 'active', stripe_subscription_id: subscriptionId })
      .eq('user_id', userId);
    check(error, 'update seller_profiles (renewal)');
  }

  // invoice.paid e invoice.payment_succeeded llegan ambos: deduplicar por invoice id.
  const { data: existing, error: exErr } = await db
    .from('payments')
    .select('id')
    .eq('stripe_invoice_id', invoice.id)
    .maybeSingle();
  check(exErr, 'select payments');
  if (existing) return;

  let sellerProfileId = seller?.id ?? null;
  if (!sellerProfileId) {
    const { data: sp, error: spErr } = await db
      .from('seller_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    check(spErr, 'select seller_profiles by user');
    sellerProfileId = sp?.id ?? null;
  }

  const line = invoice.lines?.data?.[0];
  const { error: payErr } = await db.from('payments').insert({
    user_id: userId,
    seller_profile_id: sellerProfileId,
    amount: (invoice.amount_paid ?? 0) / 100,
    currency: (invoice.currency ?? 'usd').toUpperCase(),
    status: 'completed',
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    plan_id: Number.isFinite(planId) ? planId : null,
    billing_period_start: toIso(line?.period?.start ?? invoice.period_start),
    billing_period_end: toIso(line?.period?.end ?? invoice.period_end),
  });
  check(payErr, 'insert payments');
}

// ── invoice.payment_failed ──────────────────────────────────────────────────
async function handleInvoiceFailed(db: SupabaseClient, invoice: Stripe.Invoice) {
  const customerId = idOf(invoice.customer);
  if (!customerId) return;
  const { error } = await db
    .from('seller_profiles')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId);
  check(error, 'update seller_profiles (past_due)');
}

// ── customer.subscription.updated ───────────────────────────────────────────
async function handleSubscriptionUpdated(db: SupabaseClient, sub: Stripe.Subscription) {
  const customerId = idOf(sub.customer);
  if (!customerId) return;
  // cancel_at_period_end no cambia el estado: sigue activa hasta que llegue .deleted
  const { error } = await db
    .from('seller_profiles')
    .update({
      subscription_status: mapStatus(sub.status),
      stripe_subscription_id: sub.id,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);
  check(error, 'update seller_profiles (subscription.updated)');
}

// ── customer.subscription.deleted ───────────────────────────────────────────
async function handleSubscriptionDeleted(db: SupabaseClient, sub: Stripe.Subscription) {
  const customerId = idOf(sub.customer);
  if (!customerId) return;
  const { error } = await db
    .from('seller_profiles')
    .update({
      subscription_status: 'inactive',
      subscription_plan: 'trial',
      stripe_subscription_id: null,
      stripe_price_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
    .eq('stripe_subscription_id', sub.id);
  check(error, 'update seller_profiles (subscription.deleted)');
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET no configurada');
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Falta Stripe-Signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'firma inválida';
    console.error('[stripe] Webhook validation error:', msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  const db = createAdminClient();

  // Idempotencia: registrar el evento antes de procesarlo.
  const { error: insErr } = await db
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type });
  if (insErr) {
    if (insErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('[stripe] No se pudo registrar el evento:', insErr.message);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(db, event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoiceFailed(db, event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(db, event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(db, event.data.object as Stripe.Subscription);
        break;
      default:
        // Evento no manejado: queda registrado y se responde 200.
        break;
    }
  } catch (err) {
    console.error(`[stripe] Error procesando ${event.type} (${event.id}):`, err);
    // Liberar el evento para que el reintento de Stripe lo procese.
    await db.from('stripe_events').delete().eq('event_id', event.id);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
