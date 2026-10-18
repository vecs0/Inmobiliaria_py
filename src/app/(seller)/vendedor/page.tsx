import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/v2/DashboardClient';
import { fetchSellerDashboard } from '@/lib/seller/fetch-dashboard';
import { getViewsLeadsSeries } from '@/lib/supabase/analytics-actions';

export const dynamic = 'force-dynamic';

export default async function SellerDashboardPage() {
  const [data, series] = await Promise.all([
    fetchSellerDashboard(),
    getViewsLeadsSeries(30).catch(() => []),
  ]);
  if (!data) redirect('/auth/login?redirect=/vendedor');

  return <DashboardClient {...data} series={series} />;
}
