import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { appUrl } from '@/lib/stripe/urls';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // successUrl / cancelUrl del cliente se ignoran a propósito (open redirect).
    const body = await req.json().catch(() => ({}));
    const planId = Number.parseInt(String(body?.planId ?? ''), 10);
    if (!Number.isFinite(planId)) {
      return NextResponse.json({ error: 'Falta el ID del plan' }, { status: 400 });
    }

    const db = createAdminClient();

    const { data: plan, error: planError } = await db
      .from('subscription_plans')
      .select('id, name, price_usd, max_properties, stripe_price_id, is_active')
      .eq('id', planId)
      .maybeSingle();
    if (planError || !plan || !plan.is_active) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const { data: seller, error: sellerErr } = await db
      .from('seller_profiles')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (sellerErr) throw sellerErr;
    if (!seller) {
      return NextResponse.json({ error: 'Perfil de vendedor no encontrado' }, { status: 403 });
    }

    const stripe = getStripe();
    let customerId: string | null = seller.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id, seller_profile_id: seller.id },
      });
      customerId = customer.id;
      const { error: upErr } = await db
        .from('seller_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', seller.id);
      if (upErr) throw upErr;
    }

    const metadata = {
      type: 'subscription',
      supabase_user_id: user.id,
      seller_profile_id: seller.id,
      plan_id: String(plan.id),
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        plan.stripe_price_id
          ? { price: plan.stripe_price_id, quantity: 1 }
          : {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Plan ${plan.name}`,
                  description: `Suscripción InmobiliariaPY - ${plan.max_properties} propiedades`,
                },
                unit_amount: Math.round(Number(plan.price_usd) * 100),
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
      ],
      success_url: appUrl('/vendedor/suscripcion?status=success'),
      cancel_url: appUrl('/vendedor/suscripcion?status=cancel'),
      metadata,
      // Para que invoice.* y customer.subscription.* lleven la misma metadata
      subscription_data: { metadata },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error en Stripe Checkout:', error);
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 });
  }
}
