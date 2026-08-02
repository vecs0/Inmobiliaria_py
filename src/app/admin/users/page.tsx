import { createClient } from '@/lib/supabase/server';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('auth.users')
    .select('id, email, created_at, raw_user_meta_data, last_sign_in_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '24px', color: 'var(--white)' }}>
        Gestión de Usuarios
      </h1>
      <AdminUsersClient users={users || []} />
    </div>
  );
}
