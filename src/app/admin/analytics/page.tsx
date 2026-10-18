import { createAdminClient } from '@/lib/supabase/admin';
import { AdminAnalyticsClient } from '@/components/admin/AdminAnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const supabase = createAdminClient();

  // Get analytics data
  const { data: listingsByMonth } = await supabase
    .from('listings')
    .select('created_at')
    .order('created_at', { ascending: true });

  const { data: listingsByStatus } = await supabase
    .from('listings')
    .select('status')
    .not('status', 'is', null);

  const { data: listingsByType } = await supabase
    .from('listings')
    .select('operation_type')
    .not('operation_type', 'is', null);

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '24px', color: 'var(--white)' }}>
        Analíticas
      </h1>
      <AdminAnalyticsClient 
        listingsByMonth={listingsByMonth || []}
        listingsByStatus={listingsByStatus || []}
        listingsByType={listingsByType || []}
      />
    </div>
  );
}
