import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No hay suscripción activa' }, { status: 400 });
  }

  try {
    // Cancelar al final del período (no inmediatamente)
    await stripe.subscriptions.update(seller.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await supabase
      .from('seller_profiles')
      .update({ subscription_status: 'canceled' })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
