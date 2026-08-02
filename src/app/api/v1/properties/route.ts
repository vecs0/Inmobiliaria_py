import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateApiKey, apiError } from '@/lib/api/validate-key';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: Request) {
  const validated = await validateApiKey(req);
  if (!validated) return apiError('API key inválida o límite diario alcanzado', 401);

  const { searchParams } = new URL(req.url);

  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const offset  = (page - 1) * limit;

  const ciudad    = searchParams.get('ciudad');
  const tipo      = searchParams.get('tipo');
  const precioMin = searchParams.get('precio_min');
  const precioMax = searchParams.get('precio_max');
  const dormMin   = searchParams.get('dormitorios_min');
  const order     = searchParams.get('order') === 'asc' ? true : false; // precio asc/desc

  let query = supabaseAdmin
    .from('properties')
    .select(
      'id, title, type, location, city, price, currency, bedrooms, bathrooms, sqm, images, featured, status, created_at',
      { count: 'exact' }
    )
    .eq('status', 'active');

  if (ciudad)    query = query.ilike('city', `%${ciudad}%`);
  if (tipo)      query = query.eq('type', tipo);
  if (precioMin) query = query.gte('price', parseFloat(precioMin));
  if (precioMax) query = query.lte('price', parseFloat(precioMax));
  if (dormMin)   query = query.gte('bedrooms', parseInt(dormMin));

  query = query
    .order('featured', { ascending: false })
    .order('price', { ascending: order })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) return apiError('Error al obtener propiedades', 500);

  const totalPages = Math.ceil((count ?? 0) / limit);

  return NextResponse.json({
    data,
    meta: {
      total: count ?? 0,
      page,
      limit,
      total_pages: totalPages,
      has_next: page < totalPages,
    },
  }, {
    headers: {
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Remaining': '999', // simplificado
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    }
  });
}
