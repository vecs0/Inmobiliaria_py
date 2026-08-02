'use server';

import { createClient } from './server';
import { PropertyBoost } from './types';

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
  } catch { return []; }
}

export async function getActiveBoostPropertyIds(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('property_boosts')
      .select('property_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;
    return (data ?? []).map((r: any) => r.property_id);
  } catch { return []; }
}

export async function getSellerProperties() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('listings')
      .select('id, title, location, type, price, status, image_url')
      .eq('seller_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return data ?? [];
  } catch { return []; }
}
