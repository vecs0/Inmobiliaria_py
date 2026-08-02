import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DAILY_LIMIT = 1000;

export interface ValidatedKey {
  sellerId: string;
  keyId: string;
}

export async function validateApiKey(req: Request): Promise<ValidatedKey | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith('impy_')) return null;

  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const { data: keyRow, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, seller_id, active, requests_today')
    .eq('key_hash', keyHash)
    .single();

  if (error || !keyRow || !keyRow.active) return null;
  if (keyRow.requests_today >= DAILY_LIMIT) return null;

  // Actualizar contadores de forma no bloqueante
  supabaseAdmin
    .from('api_keys')
    .update({
      requests_today: keyRow.requests_today + 1,
      requests_total: (keyRow as any).requests_total + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', keyRow.id)
    .then(() => {});

  return { sellerId: keyRow.seller_id, keyId: keyRow.id };
}

export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
