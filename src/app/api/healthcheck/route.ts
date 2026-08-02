import { NextRequest, NextResponse } from 'next/server';
import { checkSupabaseConnection, testISRCache } from '@/lib/supabase/healthcheck';
import { handleCors, addCorsHeaders } from '@/lib/cors';

/**
 * Endpoint de healthcheck para validar Supabase
 *
 * GET /api/healthcheck
 *
 * Response:
 * {
 *   supabase: { ok: true, latency: 45, propertiesCount: 6, agentsCount: 3 },
 *   isr: { ok: true, cachedCount: 3 }
 * }
 */
export async function OPTIONS(req: NextRequest) {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const corsPreflight = handleCors(req);
  if (corsPreflight) return corsPreflight;
  
  const [supabaseResult, isrResult] = await Promise.all([
    checkSupabaseConnection(),
    testISRCache(),
  ]);

  const isHealthy = supabaseResult.ok && isrResult.ok;

  const response = NextResponse.json({
    supabase: supabaseResult,
    isr: isrResult,
    timestamp: new Date().toISOString(),
    status: isHealthy ? 'healthy' : 'degraded',
  }, {
    status: isHealthy ? 200 : 503,
  });
  
  return addCorsHeaders(response);
}