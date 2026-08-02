export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/roles';
import { getSimilarProperties } from '@/lib/supabase/similar-actions';
import { mapPropertiesFromApi } from '@/lib/property-adapter';
import { RecomendadasClient } from '@/components/v2/RecomendadasClient';

export default async function RecomendadasPage() {
  const supabase = await createClient();
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login');

  // 1. Obtener últimas propiedades vistas por el usuario
  const { data: history } = await supabase
    .from('search_history')
    .select('property_id')
    .eq('user_id', ctx.userId)
    .eq('action', 'view')
    .not('property_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  const viewedIds = [...new Set((history ?? []).map((h) => h.property_id).filter(Boolean))] as string[];
  const hasHistory = viewedIds.length > 0;

  let properties: Awaited<ReturnType<typeof mapPropertiesFromApi>> = [];

  if (hasHistory) {
    // 2. Buscar propiedad semilla (la más reciente vista)
    const { data: seedProp } = await supabase
      .from('properties')
      .select('id, type, price, city, bedrooms')
      .eq('id', viewedIds[0])
      .maybeSingle();

    if (seedProp) {
      // 3. Buscar similares por IA (pgvector + fallback)
      const similar = await getSimilarProperties(seedProp.id, {
        type: seedProp.type ?? 'casa',
        price: seedProp.price ?? 0,
        location: seedProp.city ?? '',
        bedrooms: seedProp.bedrooms ?? 0,
      });

      if (similar.length > 0) {
        const similarIds = similar.map((s) => s.id).filter((id) => !viewedIds.includes(id));

        if (similarIds.length > 0) {
          const { data: rows } = await supabase
            .from('properties')
            .select('*')
            .in('id', similarIds)
            .eq('status', 'active')
            .limit(12);

          properties = mapPropertiesFromApi(rows ?? []);
        }
      }
    }
  }

  // 4. Fallback: propiedades destacadas recientes si no hay recomendaciones por IA
  if (properties.length < 6) {
    const { data: featured } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .not('featured_until', 'is', null)
      .gt('featured_until', new Date().toISOString())
      .order('featured_until', { ascending: false })
      .limit(12 - properties.length);

    const featuredMapped = mapPropertiesFromApi(featured ?? []);
    const existingIds = new Set(properties.map((p) => p.id));
    properties = [...properties, ...featuredMapped.filter((p) => !existingIds.has(p.id))];
  }

  // 5. Si aún no hay suficientes, traer las más recientes
  if (properties.length < 6) {
    const { data: recents } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12 - properties.length);

    const recentsMapped = mapPropertiesFromApi(recents ?? []);
    const existingIds = new Set(properties.map((p) => p.id));
    properties = [...properties, ...recentsMapped.filter((p) => !existingIds.has(p.id))];
  }

  return <RecomendadasClient properties={properties} hasHistory={hasHistory} />;
}
