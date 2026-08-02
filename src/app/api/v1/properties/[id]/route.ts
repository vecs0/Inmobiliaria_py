import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateApiKey, apiError } from '@/lib/api/validate-key';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const validated = await validateApiKey(req);
  if (!validated) return apiError('API key inválida o límite diario alcanzado', 401);

  const { data, error } = await supabaseAdmin
    .from('properties')
    .select(
      'id, title, type, location, city, neighborhood, price, currency, bedrooms, bathrooms, sqm, images, description, amenities, featured, status, latitude, longitude, created_at'
    )
    .eq('id', resolvedParams.id)
    .eq('status', 'active')
    .single();

  if (error || !data) return apiError('Propiedad no encontrada', 404);

  return NextResponse.json({ data }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    }
  });
}
