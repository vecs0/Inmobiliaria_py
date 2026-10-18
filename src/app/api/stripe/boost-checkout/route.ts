import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { appUrl } from '@/lib/stripe/urls';
import { getPlanByKey } from '@/lib/stripe/boost-plans';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const propertyId = typeof body?.propertyId === 'string' ? body.propertyId : null;
    const planKey = typeof body?.planKey === 'string' ? body.planKey : null;
    if (!propertyId || !planKey) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const plan = getPlanByKey(planKey);
    if (!plan) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });

    const db = createAdminClient();

    const { data: seller, error: sellerErr } = await db
      .from('seller_profiles')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (sellerErr) throw sellerErr;
    if (!seller) return NextResponse.json({ error: 'Perfil de vendedor no encontrado' }, { status: 403 });

    // Verificar que el listing pertenece al vendedor
    const { data: listing, error: listingErr } = await db
      .from('listings')
      .select('id, title')
      .eq('id', propertyId)
      .eq('seller_profile_id', seller.id)
      .maybeSingle();
    if (listingErr) throw listingErr;
    if (!listing) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });

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

    // Boost en estado pending (solo service role puede escribir property_boosts)
    const { data: boost, error: boostErr } = await db
      .from('property_boosts')
      .insert({
        property_id: listing.id,
        seller_id: user.id,
        plan_key: plan.key,
        price_usd: plan.priceUsd,
        status: 'pending',
      })
      .select('id')
      .single();
    if (boostErr || !boost) throw boostErr ?? new Error('Error creando boost');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(plan.priceUsd * 100),
          product_data: {
            name: `Destacado PRO — ${plan.label}`,
            description: `Propiedad: ${listing.title}`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        type: 'boost',
        boost_id: boost.id,
        property_id: listing.id,
        seller_id: user.id,
        seller_profile_id: seller.id,
        plan_key: plan.key,
        plan_days: String(plan.days),
      },
      // success/cancelled se mantienen por compatibilidad con DestacadosV2Client
      success_url: appUrl(`/vendedor/destacados?status=success&success=1&boost=${boost.id}`),
      cancel_url: appUrl('/vendedor/destacados?status=cancel&cancelled=1'),
    });

    const { error: sessErr } = await db
      .from('property_boosts')
      .update({ stripe_session_id: session.id })
      .eq('id', boost.id);
    if (sessErr) console.error('[boost-checkout] no se guardó stripe_session_id:', sessErr.message);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Boost checkout error:', err);
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 });
  }
}
