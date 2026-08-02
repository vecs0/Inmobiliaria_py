import { SellerPropertiesClient } from '@/components/v2/SellerPropertiesClient';
import { fetchSellerDashboard } from '@/lib/seller/fetch-dashboard';

export default async function VendedorPropiedadesPage() {
  const data = await fetchSellerDashboard();
  const listings = data?.listings ?? [];

  return <SellerPropertiesClient listings={listings} />;
}
