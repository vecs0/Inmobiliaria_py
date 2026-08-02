'use server';

import { createClient } from './server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { ApiKey } from './types';

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function generateKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const random = randomBytes(24).toString('base64url');
  const rawKey = `impy_${random}`;
  const keyPrefix = rawKey.slice(0, 12); // "impy_" + 7 chars
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  return { rawKey, keyPrefix, keyHash };
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('api_keys')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (data ?? []) as ApiKey[];
}

export async function createApiKey(name: string): Promise<{ key: ApiKey; rawKey: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Límite: 5 keys por seller
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('active', true);

  if ((count ?? 0) >= 5) return null;

  const { rawKey, keyPrefix, keyHash } = generateKey();

  const { data, error } = await supabase
    .from('api_keys')
    .insert({ seller_id: user.id, name: name.trim(), key_prefix: keyPrefix, key_hash: keyHash })
    .select()
    .single();

  if (error || !data) return null;
  return { key: data as ApiKey, rawKey };
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('api_keys')
    .update({ active: false })
    .eq('id', keyId)
    .eq('seller_id', user.id);

  return !error;
}

export async function deleteApiKey(keyId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('seller_id', user.id);

  return !error;
}
