import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();

  const { data: page } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: profiles } = await admin.from('profiles').select('id, role, full_name');
  const roleById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const users = (page?.users ?? [])
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 100)
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      full_name: roleById.get(u.id)?.full_name || u.user_metadata?.full_name || null,
      role: roleById.get(u.id)?.role ?? 'user',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '24px', color: 'var(--white)' }}>
        Gestión de Usuarios
      </h1>
      <AdminUsersClient users={users} currentUserId={me?.id ?? ''} />
    </div>
  );
}
