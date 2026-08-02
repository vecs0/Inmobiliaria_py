import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { planId, successUrl, cancelUrl } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'Falta el ID del plan' }, { status: 400 });
    }

    // 1. Obtener datos del plan desde la base de datos
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // 2. Obtener o crear el perfil del vendedor para conseguir el stripe_customer_id
    const { data: sellerProfile } = await supabase
      .from('seller_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = sellerProfile?.stripe_customer_id;

    if (!customerId) {
      // Crear cliente en Stripe si no existe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Actualizar el perfil con el nuevo customerId
      await supabase
        .from('seller_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // 3. Crear sesión de Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Plan ${plan.name}`,
              description: `Suscripción InmobiliariaPY - ${plan.max_properties} propiedades`,
            },
            unit_amount: Math.round(plan.price_usd * 100), // Stripe usa centavos
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/vendedor/suscripcion?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/vendedor/suscripcion?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error en Stripe Checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
