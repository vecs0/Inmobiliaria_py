export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { PublicChrome } from '@/components/PublicChrome';
import { FavoritosClient } from '@/components/v2/FavoritosClient';
import { getUserContext } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { mapPropertiesFromApi } from '@/lib/property-adapter';

export default async function FavoritosPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login?redirect=/comprador/favoritos');

  const supabase = await createClient();

  const { data: favRows } = await supabase
    .from('favorites')
    .select('property_id')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });

  const favIds = (favRows ?? []).map((r) => r.property_id).filter(Boolean) as string[];
  let listingRows: Record<string, unknown>[] = [];
  if (favIds.length > 0) {
    const { data } = await supabase.from('properties_full').select('*').in('id', favIds);
    const byId = new Map((data ?? []).map((p) => [p.id as string, p as Record<string, unknown>]));
    listingRows = favIds.map((id) => byId.get(id)).filter(Boolean) as Record<string, unknown>[];
  }

  const properties = mapPropertiesFromApi(listingRows);

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            <span /> COMPRADOR · FAVORITOS <span />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: 40 }}>
            Tus propiedades <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>guardadas.</span>
          </h1>
          <FavoritosClient properties={properties} userId={ctx.userId} />
        </div>
      </PublicChrome>
    </main>
  );
}
