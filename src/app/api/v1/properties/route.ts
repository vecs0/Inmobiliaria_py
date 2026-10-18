import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkApiKey, apiError, rateLimitHeaders, intParam, numParam } from '@/lib/api/validate-key';

export const dynamic = 'force-dynamic';

const LIST_COLUMNS =
  'id, title, type, operation_type, location, city, price, currency, bedrooms, bathrooms, sqm, image, images, featured, status, created_at';

/** Escapa comodines de LIKE en input del usuario. */
function likeEscape(s: string): string {
  return s.replace(/[\%_]/g, (m) => `\${m}`);
}

export async function GET(req: Request) {
  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.message, auth.status);
  const headers = rateLimitHeaders(auth.key.remaining);

  const { searchParams } = new URL(req.url);
  const page = intParam(searchParams.get('page'), 1, 1, 10_000);
  const limit = intParam(searchParams.get('limit'), 20, 1, 100);
  const offset = (page - 1) * limit;

  const ciudad = searchParams.get('ciudad')?.trim().slice(0, 80);
  const tipo = searchParams.get('tipo')?.trim().slice(0, 40);
  const operacion = searchParams.get('operacion')?.trim().slice(0, 20);
  const precioMin = numParam(searchParams.get('precio_min'));
  const precioMax = numParam(searchParams.get('precio_max'));
  const dormMinRaw = numParam(searchParams.get('dormitorios_min'));
  const ascending = searchParams.get('order') === 'asc';

  let query = createAdminClient()
    .from('properties_full')
    .select(LIST_COLUMNS, { count: 'exact' })
    .eq('status', 'active');

  if (ciudad) query = query.ilike('city', `%${likeEscape(ciudad)}%`);
  if (tipo) query = query.eq('type', tipo);
  if (operacion) query = query.eq('operation_type', operacion);
  if (precioMin != null) query = query.gte('price', precioMin);
  if (precioMax != null) query = query.lte('price', precioMax);
  if (dormMinRaw != null) query = query.gte('bedrooms', Math.floor(dormMinRaw));

  const { data, error, count } = await query
    .order('featured', { ascending: false })
    .order('price', { ascending })
    .range(offset, offset + limit - 1);

  if (error) return apiError('Error al obtener propiedades', 500, headers);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json(
    {
      data: data ?? [],
      meta: { total, page, limit, total_pages: totalPages, has_next: page < totalPages },
    },
    { headers },
  );
}
