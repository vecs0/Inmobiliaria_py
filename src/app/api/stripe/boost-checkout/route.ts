import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { getPlanByKey } from '@/lib/stripe/boost-plans';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inmobiliariapy.com';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { propertyId, planKey } = await req.json();
    if (!propertyId || !planKey) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const plan = getPlanByKey(planKey);
    if (!plan) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });

    // Verificar que la propiedad pertenece al vendedor
    const { data: prop, error: propErr } = await supabase
      .from('listings')
      .select('id, title')
      .eq('id', propertyId)
      .eq('seller_id', user.id)
      .single();

    if (propErr || !prop) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Obtener/crear Stripe customer
    const { data: sellerProfile } = await supabase
      .from('seller_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = sellerProfile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('seller_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Crear registro de boost en estado pending
    const { data: boost, error: boostErr } = await supabase
      .from('property_boosts')
      .insert([{
        property_id: propertyId,
        seller_id: user.id,
        plan_key: planKey,
        price_usd: plan.priceUsd,
        status: 'pending',
      }])
      .select()
      .single();

    if (boostErr || !boost) throw new Error('Error creando boost');

    // Crear Stripe checkout session (pago único)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(plan.priceUsd * 100),
          product_data: {
            name: `Destacado PRO — ${plan.label}`,
            description: `Propiedad: ${prop.title}`,
            images: [],
          },
        },
        quantity: 1,
      }],
      metadata: {
        type: 'boost',
        boost_id: boost.id,
        property_id: propertyId,
        seller_id: user.id,
        plan_key: planKey,
        plan_days: String(plan.days),
      },
      success_url: `${SITE_URL}/vendedor/destacados?success=1&boost=${boost.id}`,
      cancel_url:  `${SITE_URL}/vendedor/destacados?cancelled=1`,
    });

    // Guardar session ID en el boost
    await supabase.from('property_boosts')
      .update({ stripe_session_id: session.id })
      .eq('id', boost.id);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Boost checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
