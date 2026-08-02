export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SuscripcionClient } from '@/components/v2/SuscripcionClient';
import type { SellerPlan, PlanRow, PaymentRow } from '@/components/v2/SuscripcionClient';

export default async function SuscripcionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [sellerRes, plansRes, paymentsRes] = await Promise.all([
    supabase
      .from('seller_profiles')
      .select('id, subscription_plan, subscription_status, stripe_subscription_id, max_properties, properties_count, trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle(),

    supabase
      .from('subscription_plans')
      .select('id, name, plan_type, price_usd, max_properties, max_agents, features, stripe_price_id')
      .eq('is_active', true)
      .order('price_usd', { ascending: true }),

    supabase
      .from('payments')
      .select('id, amount, currency, status, billing_period_start, billing_period_end, created_at, subscription_plans(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (!sellerRes.data) redirect('/vendedor');

  const seller: SellerPlan = {
    id: sellerRes.data.id,
    subscription_plan: sellerRes.data.subscription_plan,
    subscription_status: sellerRes.data.subscription_status,
    stripe_subscription_id: sellerRes.data.stripe_subscription_id,
    max_properties: sellerRes.data.max_properties ?? 5,
    properties_count: sellerRes.data.properties_count ?? 0,
    trial_ends_at: sellerRes.data.trial_ends_at,
  };

  return (
    <SuscripcionClient
      seller={seller}
      plans={(plansRes.data ?? []) as PlanRow[]}
      payments={(paymentsRes.data ?? []) as unknown as PaymentRow[]}
    />
  );
}
