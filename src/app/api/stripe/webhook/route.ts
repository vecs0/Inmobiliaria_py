import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook validation error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;

      // ── BOOST (pago único) ──────────────────────────────────────
      if (type === 'boost') {
        const boostId    = session.metadata?.boost_id;
        const planDays   = parseInt(session.metadata?.plan_days ?? '7');
        const propertyId = session.metadata?.property_id;

        if (boostId && propertyId) {
          const now      = new Date();
          const expiresAt = new Date(now.getTime() + planDays * 86400000);

          await supabase.from('property_boosts').update({
            status:                'active',
            stripe_payment_intent: session.payment_intent as string,
            starts_at:             now.toISOString(),
            expires_at:            expiresAt.toISOString(),
          }).eq('id', boostId);

          // Marcar propiedad como featured mientras dure el boost
          await supabase.from('listings')
            .update({ featured: true })
            .eq('id', propertyId);

          console.log(`Boost activado: ${boostId} hasta ${expiresAt.toISOString()}`);
        }
        break;
      }

      // ── SUSCRIPCIÓN (flujo original) ────────────────────────────
      const userId = session.metadata?.supabase_user_id;
      const planId = session.metadata?.plan_id;

      if (userId && planId) {
        await supabase.from('seller_profiles').update({
          subscription_status:      'active',
          stripe_subscription_id:   session.subscription as string,
        }).eq('user_id', userId);

        await supabase.from('payments').insert({
          user_id:                  userId,
          amount:                   (session.amount_total || 0) / 100,
          status:                   'completed',
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_subscription_id:   session.subscription as string,
          plan_id:                  parseInt(planId),
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase.from('seller_profiles')
        .update({ subscription_status: 'inactive' })
        .eq('stripe_customer_id', subscription.customer as string);
      break;
    }

    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
