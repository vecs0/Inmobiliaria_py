import { createClient } from '@/lib/supabase/server';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch dashboard stats
  const [
    { count: totalUsers },
    { count: totalProperties },
    { count: activeListings },
    { count: totalSellers },
  ] = await Promise.all([
    supabase.from('auth.users').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('seller_profiles').select('*', { count: 'exact', head: true }),
  ]);

  // Fetch recent activity
  const { data: recentListings } = await supabase
    .from('listings')
    .select('id, title, created_at, status, price')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentUsers } = await supabase
    .from('auth.users')
    .select('id, email, created_at, raw_user_meta_data')
    .order('created_at', { ascending: false })
    .limit(10);

  const stats = {
    totalUsers: totalUsers || 0,
    totalProperties: totalProperties || 0,
    activeListings: activeListings || 0,
    totalSellers: totalSellers || 0,
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '24px', color: 'var(--white)' }}>
        Panel de Administración
      </h1>
      <AdminDashboardClient 
        stats={stats}
        recentListings={recentListings || []}
        recentUsers={recentUsers || []}
      />
    </div>
  );
}
