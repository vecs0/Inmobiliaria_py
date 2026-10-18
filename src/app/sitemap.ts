import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://inmobiliariapy.com').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/propiedades`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/propiedades?operacion=venta`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/propiedades?operacion=alquiler`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/api-docs`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/auth/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return staticPages;

  try {
    // Datos públicos: cliente anon sin cookies (RLS aplica).
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from('properties_full')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(45000);
    if (error) throw error;

    const listings: MetadataRoute.Sitemap = (data ?? [])
      .filter((r: { id: string | null }) => r.id)
      .map((r: { id: string | null; updated_at: string | null; created_at: string | null }) => ({
        url: `${BASE}/propiedades/${r.id}`,
        lastModified: new Date(r.updated_at || r.created_at || now),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    return [...staticPages, ...listings];
  } catch (err) {
    console.error('[sitemap] error cargando listings:', err);
    return staticPages;
  }
}
