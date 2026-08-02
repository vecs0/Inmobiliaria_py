import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/v2/DashboardClient';
import { fetchSellerDashboard } from '@/lib/seller/fetch-dashboard';

export const dynamic = 'force-dynamic';

export default async function SellerDashboardPage() {
  const data = await fetchSellerDashboard();
  if (!data) redirect('/auth/login');

  return <DashboardClient {...data} />;
}
