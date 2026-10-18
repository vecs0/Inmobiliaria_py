import { createAdminClient } from '@/lib/supabase/admin';
import { AdminPropertiesClient } from '@/components/admin/AdminPropertiesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const supabase = createAdminClient();

  const { data: listings } = await supabase
    .from('listings')
    .select(`
      id, title, price, currency, operation_type, status, created_at,
      seller_profiles (
        id, company_name, full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '24px', color: 'var(--white)' }}>
        Gestión de Propiedades
      </h1>
      <AdminPropertiesClient listings={listings || []} />
    </div>
  );
}
