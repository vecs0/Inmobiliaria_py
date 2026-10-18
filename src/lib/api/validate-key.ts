import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const DAILY_LIMIT = 1000;

export interface ValidatedKey {
  sellerId: string;
  keyId: string;
  /** Requests usados hoy, incluyendo el actual. */
  requestsToday: number;
  /** Requests restantes hoy (>= 0). */
  remaining: number;
}

export type ValidateResult =
  | { ok: true; key: ValidatedKey }
  | { ok: false; status: 401 | 429 | 500; message: string };

export async function checkApiKey(req: Request): Promise<ValidateResult> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Falta API key (Authorization: Bearer impy_...)' };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith('impy_')) return { ok: false, status: 401, message: 'API key inválida' };

  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const db = createAdminClient();

  const { data: keyRow, error } = await db
    .from('api_keys')
    .select('id, seller_id, active')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error) return { ok: false, status: 500, message: 'Error validando API key' };
  if (!keyRow || !keyRow.active) return { ok: false, status: 401, message: 'API key inválida' };

  // Incremento atómico; devuelve requests_today ya incrementado.
  const { data: count, error: rpcErr } = await db.rpc('increment_api_key_usage', { p_key_id: keyRow.id });
  if (rpcErr) return { ok: false, status: 500, message: 'Error registrando uso de API key' };

  const requestsToday = typeof count === 'number' ? count : Number(count ?? 0);
  if (requestsToday > DAILY_LIMIT) {
    return { ok: false, status: 429, message: 'Límite diario de requests alcanzado' };
  }

  return {
    ok: true,
    key: {
      sellerId: keyRow.seller_id,
      keyId: keyRow.id,
      requestsToday,
      remaining: Math.max(0, DAILY_LIMIT - requestsToday),
    },
  };
}

/** @deprecated usar checkApiKey() para obtener status y remaining. */
export async function validateApiKey(req: Request): Promise<ValidatedKey | null> {
  const r = await checkApiKey(req);
  return r.ok ? r.key : null;
}

export function rateLimitHeaders(remaining: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(DAILY_LIMIT),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'Cache-Control': 'private, no-store',
  };
}

export function apiError(message: string, status: number, headers?: Record<string, string>) {
  return Response.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'private, no-store', ...(headers ?? {}) } },
  );
}

/** Entero positivo con default si NaN / fuera de rango. */
export function intParam(value: string | null, def: number, min: number, max: number): number {
  const n = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

export function numParam(value: string | null): number | null {
  if (value == null || value === '') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}
