export const dynamic = 'force-dynamic';

import { PublicChrome } from '@/components/PublicChrome';
import { RecientesClient } from '@/components/v2/RecientesClient';
import { getUserContext } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { mapPropertiesFromApi } from '@/lib/property-adapter';

export default async function RecientesPage() {
  const ctx = await getUserContext();
  let properties: any[] = [];

  if (ctx) {
    // Logged-in user: fetch from Supabase
    const supabase = await createClient();

    // Últimas 20 propiedades vistas (action = 'view')
    const { data: rows } = await supabase
      .from('search_history')
      .select('property_id, created_at')
      .eq('user_id', ctx.userId)
      .eq('action', 'view')
      .not('property_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    // Deduplicar por property_id (nos quedamos con la vista más reciente)
    const seen = new Set<string>();
    const uniqueRows = (rows ?? []).filter((r: Record<string, unknown>) => {
      const pid = String(r.property_id ?? '');
      if (seen.has(pid)) return false;
      seen.add(pid);
      return true;
    });

    const ids = uniqueRows.map((r: Record<string, unknown>) => String(r.property_id));
    if (ids.length > 0) {
      const { data: listingRows } = await supabase.from('properties_full').select('*').in('id', ids);
      const byId = new Map((listingRows ?? []).map((p) => [p.id as string, p as Record<string, unknown>]));
      properties = mapPropertiesFromApi(
        ids.map((id) => byId.get(id)).filter(Boolean) as Record<string, unknown>[]
      );
    }
  }
  // If not logged in, RecientesClient will use localStorage fallback

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            <span /> COMPRADOR · RECIENTES <span />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: 40 }}>
            Vistas <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>recientemente.</span>
          </h1>
          <RecientesClient properties={properties} isLoggedIn={!!ctx} />
        </div>
      </PublicChrome>
    </main>
  );
}
