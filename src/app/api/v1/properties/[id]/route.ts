import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkApiKey, apiError, rateLimitHeaders } from '@/lib/api/validate-key';

export const dynamic = 'force-dynamic';

const DETAIL_COLUMNS =
  'id, title, type, operation_type, location, city, neighborhood, price, currency, bedrooms, bathrooms, sqm, image, images, description, amenities, featured, status, latitude, longitude, created_at';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const auth = await checkApiKey(req);
  if (!auth.ok) return apiError(auth.message, auth.status);
  const headers = rateLimitHeaders(auth.key.remaining);

  if (!id || id.length > 64) return apiError('Propiedad no encontrada', 404, headers);

  const { data, error } = await createAdminClient()
    .from('properties_full')
    .select(DETAIL_COLUMNS)
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) return apiError('Error al obtener la propiedad', 500, headers);
  if (!data) return apiError('Propiedad no encontrada', 404, headers);

  return NextResponse.json({ data }, { headers });
}
