import { createAdminClient } from '@/lib/supabase/admin';
import { AdminSellersClient } from '@/components/admin/AdminSellersClient';

export const dynamic = 'force-dynamic';

export default async function AdminSellersPage() {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from('seller_profiles')
    .select('id, user_id, company_name, full_name, seller_type, max_properties, properties_count, subscription_plan, subscription_status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const userIds = (rows ?? []).map((r) => r.user_id).filter(Boolean) as string[];
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, email').in('id', userIds)
    : { data: [] as { id: string; email: string }[] };
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const sellers = (rows ?? []).map((r) => ({ ...r, email: r.user_id ? emailById.get(r.user_id) ?? null : null }));

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '24px', color: 'var(--white)' }}>
        Gestión de Vendedores
      </h1>
      <AdminSellersClient sellers={sellers} />
    </div>
  );
}
