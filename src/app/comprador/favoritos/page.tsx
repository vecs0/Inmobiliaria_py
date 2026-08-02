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

  // JOIN favorites → properties para traer los datos completos
  const { data: rows } = await supabase
    .from('favorites')
    .select(`
      property_id,
      properties (
        id, external_id, title, type, operation_type,
        price, currency, bedrooms, bathrooms, sqm,
        city, neighborhood, status, images, boosted,
        featured_until, latitude, longitude
      )
    `)
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });

  const properties = mapPropertiesFromApi(
    (rows ?? [])
      .map((r: Record<string, unknown>) => r.properties)
      .filter(Boolean) as Record<string, unknown>[]
  );

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
