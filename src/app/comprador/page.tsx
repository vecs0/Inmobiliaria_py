export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { PublicChrome } from '@/components/PublicChrome';
import { BuyerDashboardClient } from '@/components/v2/BuyerDashboardClient';
import { getUserContext } from '@/lib/auth/roles';
import { getFeaturedProperties } from '@/lib/supabase/actions';

export default async function CompradorPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login?redirect=/comprador');
  if (ctx.role === 'seller_particular' || ctx.role === 'seller_empresa') redirect('/vendedor');

  const featured = await getFeaturedProperties(5);

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <BuyerDashboardClient userName={ctx.email.split('@')[0]} featured={featured} />
      </PublicChrome>
    </main>
  );
}
