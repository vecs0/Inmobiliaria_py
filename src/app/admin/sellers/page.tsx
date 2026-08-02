import { createClient } from '@/lib/supabase/server';
import { AdminSellersClient } from '@/components/admin/AdminSellersClient';

export const dynamic = 'force-dynamic';

export default async function AdminSellersPage() {
  const supabase = await createClient();

  const { data: sellers } = await supabase
    .from('seller_profiles')
    .select(`
      id, company_name, seller_type, max_agents, created_at, status,
      user_id,
      auth_users!inner (
        email, created_at
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '24px', color: 'var(--white)' }}>
        Gestión de Vendedores
      </h1>
      <AdminSellersClient sellers={sellers || []} />
    </div>
  );
}
