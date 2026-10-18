'use server';

import { createHash, randomBytes } from 'crypto';
import { createClient } from './server';
import { createAdminClient } from './admin';
import { ApiKey } from './types';

const MAX_ACTIVE_KEYS = 5;
const PUBLIC_COLUMNS = 'id, seller_id, name, key_prefix, active, requests_today, requests_total, last_used_at, created_at';

function generateKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const random = randomBytes(24).toString('base64url');
  const rawKey = `impy_${random}`;
  const keyPrefix = rawKey.slice(0, 12); // "impy_" + 7 chars
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  return { rawKey, keyPrefix, keyHash };
}

function toApiKey(row: Record<string, unknown>): ApiKey {
  return { ...(row as unknown as ApiKey), key_hash: '' }; // el hash nunca sale al cliente
}

/** Devuelve el user id si el usuario es vendedor tipo 'empresa'; si no, null. */
async function requireCompanySeller(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: seller } = await createAdminClient()
    .from('seller_profiles')
    .select('seller_type')
    .eq('user_id', user.id)
    .maybeSingle();

  return seller?.seller_type === 'empresa' ? user.id : null;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('api_keys')
    .select(PUBLIC_COLUMNS)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (data ?? []).map((r) => toApiKey(r as Record<string, unknown>));
}

export async function createApiKey(name: string): Promise<{ key: ApiKey; rawKey: string } | null> {
  const userId = await requireCompanySeller();
  if (!userId) return null;

  const cleanName = String(name ?? '').trim().slice(0, 80);
  if (!cleanName) return null;

  const db = createAdminClient();
  const { count, error: countErr } = await db
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', userId)
    .eq('active', true);
  if (countErr || (count ?? 0) >= MAX_ACTIVE_KEYS) return null;

  const { rawKey, keyPrefix, keyHash } = generateKey();
  const { data, error } = await db
    .from('api_keys')
    .insert({ seller_id: userId, name: cleanName, key_prefix: keyPrefix, key_hash: keyHash })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error || !data) return null;
  return { key: toApiKey(data as Record<string, unknown>), rawKey };
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  const userId = await requireCompanySeller();
  if (!userId) return false;

  const { data, error } = await createAdminClient()
    .from('api_keys')
    .update({ active: false })
    .eq('id', keyId)
    .eq('seller_id', userId)
    .select('id');

  return !error && (data?.length ?? 0) > 0;
}

export async function deleteApiKey(keyId: string): Promise<boolean> {
  const userId = await requireCompanySeller();
  if (!userId) return false;

  const { data, error } = await createAdminClient()
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('seller_id', userId)
    .select('id');

  return !error && (data?.length ?? 0) > 0;
}
