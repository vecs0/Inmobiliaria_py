export const dynamic = 'force-dynamic';

import { PublicChrome } from '@/components/PublicChrome';
import { LandingClient } from '@/components/v2/LandingClient';
import { getFeaturedProperties } from '@/lib/supabase/actions';

export default async function HomePage() {
  const featuredProperties = await getFeaturedProperties(6);

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <LandingClient featuredProperties={featuredProperties} />
      </PublicChrome>
    </main>
  );
}
