'use server';

import { createClient } from './server';

// Modelo: listings.seller_profile_id → seller_profiles.id (user_id = auth.uid()).
// property_views.property_id y leads.property_id guardan listings.id.

export interface PropertyAnalyticsRow {
  property_id: string;
  title: string;
  type: string;
  location: string;
  price: number;
  image_url: string;
  views_7d: number;
  views_30d: number;
  leads_total: number;
  conversion_rate: number; // leads / views_30d * 100
}

export interface OverallStats {
  views_7d: number;
  views_30d: number;
  leads_total: number;
  active_properties: number;
  conversion_rate: number;
  top_property_title: string | null;
  top_property_views: number;
}

export interface ViewsTrendPoint {
  date: string; // YYYY-MM-DD
  views: number;
}

export interface ViewsLeadsPoint {
  date: string; // YYYY-MM-DD (UTC)
  views: number;
  leads: number;
}

export interface ListingCounts {
  views: number; // últimos 30 días
  leads: number; // total
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;
type ListingRow = { id: string; title: string | null; status: string | null };

const DAY_MS = 86400000;
const MAX_ROWS = 20000;

async function getSellerListings(): Promise<{ supabase: ServerSupabase; listings: ListingRow[] } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sp } = await supabase
    .from('seller_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!sp) return { supabase, listings: [] };

  const { data } = await supabase
    .from('listings')
    .select('id, title, status')
    .eq('seller_profile_id', sp.id);
  return { supabase, listings: (data ?? []) as ListingRow[] };
}

function countBy<T extends Record<string, unknown>>(rows: T[] | null | undefined, key: keyof T): Record<string, number> {
  const c: Record<string, number> = {};
  for (const r of rows ?? []) {
    const k = r[key];
    if (typeof k === 'string') c[k] = (c[k] ?? 0) + 1;
  }
  return c;
}

function emptyStats(): OverallStats {
  return { views_7d: 0, views_30d: 0, leads_total: 0, active_properties: 0, conversion_rate: 0, top_property_title: null, top_property_views: 0 };
}

function rate(leads: number, views: number): number {
  return views > 0 ? Math.round((leads / views) * 100 * 10) / 10 : 0;
}

function dayKeys(days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10));
  return keys;
}

export async function getOverallStats(): Promise<OverallStats> {
  try {
    const ctx = await getSellerListings();
    if (!ctx || ctx.listings.length === 0) return emptyStats();
    const { supabase, listings } = ctx;
    const ids = listings.map((l) => l.id);

    const d7 = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const d30 = new Date(Date.now() - 30 * DAY_MS).toISOString();

    const [v30Res, leadsRes] = await Promise.all([
      supabase.from('property_views').select('property_id, created_at').in('property_id', ids).gte('created_at', d30).limit(MAX_ROWS),
      supabase.from('leads').select('id', { count: 'exact', head: true }).in('property_id', ids),
    ]);

    const views30Rows = (v30Res.data ?? []) as { property_id: string; created_at: string }[];
    const views30 = views30Rows.length;
    const views7 = views30Rows.filter((r) => r.created_at >= d7).length;
    const leads = leadsRes.count ?? 0;

    const counts = countBy(views30Rows, 'property_id');
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const topTitle = top ? listings.find((l) => l.id === top[0])?.title ?? null : null;

    return {
      views_7d: views7,
      views_30d: views30,
      leads_total: leads,
      active_properties: listings.filter((l) => l.status === 'active').length,
      conversion_rate: rate(leads, views30),
      top_property_title: topTitle,
      top_property_views: top ? top[1] : 0,
    };
  } catch {
    return emptyStats();
  }
}

export async function getPropertyAnalytics(): Promise<PropertyAnalyticsRow[]> {
  try {
    const ctx = await getSellerListings();
    if (!ctx) return [];
    const activeIds = ctx.listings.filter((l) => l.status === 'active').map((l) => l.id);
    if (activeIds.length === 0) return [];
    const { supabase } = ctx;

    const d7 = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const d30 = new Date(Date.now() - 30 * DAY_MS).toISOString();

    const [propsRes, views30Res, leadsRes] = await Promise.all([
      supabase
        .from('properties_full')
        .select('id, title, type, location, city, price, image')
        .in('id', activeIds)
        .order('created_at', { ascending: false }),
      supabase.from('property_views').select('property_id, created_at').in('property_id', activeIds).gte('created_at', d30).limit(MAX_ROWS),
      supabase.from('leads').select('property_id').in('property_id', activeIds).limit(MAX_ROWS),
    ]);

    const views30Rows = (views30Res.data ?? []) as { property_id: string; created_at: string }[];
    const v30 = countBy(views30Rows, 'property_id');
    const v7 = countBy(views30Rows.filter((r) => r.created_at >= d7), 'property_id');
    const lc = countBy((leadsRes.data ?? []) as { property_id: string | null }[], 'property_id');

    type PropRow = { id: string; title: string | null; type: string | null; location: string | null; city: string | null; price: number | null; image: string | null };
    return ((propsRes.data ?? []) as PropRow[])
      .map((p): PropertyAnalyticsRow => {
        const views30 = v30[p.id] ?? 0;
        const leads = lc[p.id] ?? 0;
        return {
          property_id: p.id,
          title: p.title ?? '',
          type: p.type ?? '',
          location: p.location ?? p.city ?? '',
          price: p.price ?? 0,
          image_url: p.image ?? '',
          views_7d: v7[p.id] ?? 0,
          views_30d: views30,
          leads_total: leads,
          conversion_rate: rate(leads, views30),
        };
      })
      .sort((a, b) => b.views_30d - a.views_30d);
  } catch {
    return [];
  }
}

/** Vistas (30d) y leads (total) por listing del vendedor logueado: { [listingId]: { views, leads } }. */
export async function getListingCounts(): Promise<Record<string, ListingCounts>> {
  try {
    const ctx = await getSellerListings();
    if (!ctx || ctx.listings.length === 0) return {};
    const ids = ctx.listings.map((l) => l.id);
    const d30 = new Date(Date.now() - 30 * DAY_MS).toISOString();

    const [viewsRes, leadsRes] = await Promise.all([
      ctx.supabase.from('property_views').select('property_id').in('property_id', ids).gte('created_at', d30).limit(MAX_ROWS),
      ctx.supabase.from('leads').select('property_id').in('property_id', ids).limit(MAX_ROWS),
    ]);
    const v = countBy((viewsRes.data ?? []) as { property_id: string }[], 'property_id');
    const l = countBy((leadsRes.data ?? []) as { property_id: string | null }[], 'property_id');

    const out: Record<string, ListingCounts> = {};
    for (const id of ids) out[id] = { views: v[id] ?? 0, leads: l[id] ?? 0 };
    return out;
  } catch {
    return {};
  }
}

/** Serie diaria (UTC) de vistas y leads de los listings del vendedor logueado, rellenando días vacíos. */
export async function getViewsLeadsSeries(days = 30): Promise<ViewsLeadsPoint[]> {
  const n = Math.min(Math.max(Math.floor(days) || 30, 1), 365);
  const keys = dayKeys(n);
  const empty = keys.map((date) => ({ date, views: 0, leads: 0 }));
  try {
    const ctx = await getSellerListings();
    if (!ctx || ctx.listings.length === 0) return empty;
    const ids = ctx.listings.map((l) => l.id);
    const since = `${keys[0]}T00:00:00.000Z`;

    const [viewsRes, leadsRes] = await Promise.all([
      ctx.supabase.from('property_views').select('created_at').in('property_id', ids).gte('created_at', since).limit(MAX_ROWS),
      ctx.supabase.from('leads').select('created_at').in('property_id', ids).gte('created_at', since).limit(MAX_ROWS),
    ]);

    const vByDay: Record<string, number> = {};
    for (const r of (viewsRes.data ?? []) as { created_at: string }[]) {
      const k = r.created_at.slice(0, 10);
      vByDay[k] = (vByDay[k] ?? 0) + 1;
    }
    const lByDay: Record<string, number> = {};
    for (const r of (leadsRes.data ?? []) as { created_at: string | null }[]) {
      if (!r.created_at) continue;
      const k = r.created_at.slice(0, 10);
      lByDay[k] = (lByDay[k] ?? 0) + 1;
    }
    return keys.map((date) => ({ date, views: vByDay[date] ?? 0, leads: lByDay[date] ?? 0 }));
  } catch {
    return empty;
  }
}

export async function getViewsTrend30d(): Promise<ViewsTrendPoint[]> {
  const series = await getViewsLeadsSeries(30);
  return series.map(({ date, views }) => ({ date, views }));
}
