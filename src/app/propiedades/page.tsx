export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { PublicChrome } from '@/components/PublicChrome';
import { ListingClient, type ListingSearchParams } from '@/components/v2/ListingClient';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Propiedades en venta y alquiler | InmobiliariaPY',
  description: 'Casas, departamentos, terrenos y locales en todo Paraguay. Filtrá por ciudad, precio y dormitorios.',
};

const PAGE_SIZE = 12;

/** Quita caracteres que rompen la sintaxis de filtros `or()` de PostgREST. */
function clean(v: string): string {
  return v.replace(/[,()*%\\]/g, ' ').trim().slice(0, 80);
}

function num(v?: string): number | undefined {
  if (!v) return undefined;
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const TYPE_ALIASES: Record<string, string> = { Departamento: 'Apartamento', departamento: 'Apartamento' };

export default async function PropiedadesPage(props: { searchParams: Promise<ListingSearchParams> }) {
  const sp = await props.searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page ?? '1')) || 1);

  const supabase = await createClient();
  let query = supabase.from('properties_full').select('*', { count: 'exact' }).eq('status', 'active');

  const ciudad = sp.ciudad ? clean(sp.ciudad) : '';
  if (ciudad) query = query.or(`city.ilike.%${ciudad}%,neighborhood.ilike.%${ciudad}%`);

  const q = sp.q ? clean(sp.q) : '';
  const featuredOnly = sp.destacado === 'true' || q.toLowerCase() === 'destacado';
  if (q && q.toLowerCase() !== 'destacado') {
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%,neighborhood.ilike.%${q}%,location.ilike.%${q}%`
    );
  }
  if (featuredOnly) query = query.eq('featured', true);

  if (sp.tipo && sp.tipo !== 'Todos') query = query.eq('type', TYPE_ALIASES[sp.tipo] ?? sp.tipo);
  if (sp.operacion === 'venta' || sp.operacion === 'alquiler') query = query.eq('operation_type', sp.operacion);

  const pMin = num(sp.precio_min);
  const pMax = num(sp.precio_max);
  if (pMin) query = query.gte('price', pMin);
  if (pMax) query = query.lte('price', pMax);

  const beds = num(sp.dormitorios);
  if (beds) query = query.gte('bedrooms', beds);

  if (sp.amenities) {
    const list = sp.amenities.split(',').map((a) => a.trim()).filter(Boolean);
    if (list.length) query = query.contains('amenities', list);
  }

  switch (sp.orden) {
    case 'precio-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'precio-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'superficie':
      query = query.order('sqm', { ascending: false, nullsFirst: false });
      break;
    case 'recientes':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) console.error('[propiedades] query error:', error.message);

  // Ciudades disponibles para el filtro (desde la DB)
  const { data: cityRows } = await supabase
    .from('properties_full')
    .select('city')
    .eq('status', 'active')
    .not('city', 'is', null)
    .limit(1000);
  const cities = Array.from(
    new Set((cityRows ?? []).map((r: { city: string | null }) => r.city).filter((c): c is string => Boolean(c)))
  ).sort((a, b) => a.localeCompare(b, 'es'));

  const total = count ?? 0;

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <ListingClient
          properties={(data ?? []) as Record<string, unknown>[]}
          total={total}
          page={page}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          cities={cities}
          searchParams={sp}
        />
      </PublicChrome>
    </main>
  );
}
