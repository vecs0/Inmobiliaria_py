'use server';

import { createClient } from './server';
import { createAdminClient } from './admin';
import { PropertyBoost } from './types';

/** Boosts del usuario actual (property_boosts.seller_id = auth.users.id). */
export async function getSellerBoosts(): Promise<PropertyBoost[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('property_boosts')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as PropertyBoost[]) ?? [];
  } catch {
    return [];
  }
}

/** IDs de listings con boost activo. Lectura pública vía service role: solo devuelve ids. */
export async function getActiveBoostPropertyIds(): Promise<string[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('property_boosts')
      .select('property_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;
    const ids = (data ?? []).map((r: { property_id: string }) => r.property_id);
    return Array.from(new Set(ids));
  } catch {
    return [];
  }
}

/** Listings activos del vendedor actual (para elegir cuál destacar). */
export async function getSellerProperties() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: seller } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!seller) return [];

    const { data, error } = await supabase
      .from('properties_full')
      .select('id, title, location, city, type, price, currency, status, image, image_url:image')
      .eq('seller_profile_id', seller.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}
