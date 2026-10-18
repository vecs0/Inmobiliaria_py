import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No hay suscripción activa' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(seller.stripe_subscription_id);
    if (seller.stripe_customer_id && sub.customer !== seller.stripe_customer_id) {
      return NextResponse.json({ error: 'Suscripción no válida' }, { status: 403 });
    }

    // Cancelar al final del período. El estado en DB NO cambia aquí:
    // el webhook customer.subscription.deleted lo pondrá en 'inactive'.
    const updated = await stripe.subscriptions.update(seller.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      success: true,
      cancel_at_period_end: updated.cancel_at_period_end,
      cancel_at: updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : null,
    });
  } catch (err) {
    console.error('[cancel-subscription]', err);
    return NextResponse.json({ error: 'No se pudo cancelar la suscripción' }, { status: 500 });
  }
}
