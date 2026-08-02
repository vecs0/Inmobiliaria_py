'use server';

import { createClient } from './server';

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
  date: string;   // YYYY-MM-DD
  views: number;
}

export async function trackPropertyView(propertyId: string, sellerId: string | null, ipHash: string) {
  try {
    const supabase = await createClient();
    await supabase.from('property_views').insert([{
      property_id: propertyId,
      seller_id: sellerId,
      ip_hash: ipHash,
    }]);
  } catch {
    // Silencioso — no romper la experiencia si falla el tracking
  }
}

export async function getOverallStats(): Promise<OverallStats> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return emptyStats();

    const now = new Date();
    const d7  = new Date(now.getTime() - 7  * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

    // Obtener propiedades del vendedor
    const { data: props } = await supabase
      .from('listings')
      .select('id')
      .eq('seller_id', user.id);

    const propIds = (props ?? []).map((p: any) => p.id);
    if (propIds.length === 0) return emptyStats();

    const [v7Res, v30Res, leadsRes, activeRes] = await Promise.all([
      supabase.from('property_views').select('id', { count: 'exact', head: true })
        .in('property_id', propIds).gte('created_at', d7),
      supabase.from('property_views').select('id', { count: 'exact', head: true })
        .in('property_id', propIds).gte('created_at', d30),
      supabase.from('leads').select('id', { count: 'exact', head: true })
        .in('property_id', propIds),
      supabase.from('listings').select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id).eq('status', 'active'),
    ]);

    const views30 = v30Res.count ?? 0;
    const leads   = leadsRes.count ?? 0;

    // Top property por vistas en 30d
    const { data: topData } = await supabase
      .from('property_views')
      .select('property_id')
      .in('property_id', propIds)
      .gte('created_at', d30);

    let topPropId: string | null = null;
    let topViews = 0;
    if (topData && topData.length > 0) {
      const counts: Record<string, number> = {};
      for (const row of topData) {
        counts[row.property_id] = (counts[row.property_id] ?? 0) + 1;
      }
      topPropId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      topViews  = counts[topPropId];
    }

    let topTitle: string | null = null;
    if (topPropId) {
      const { data: propData } = await supabase
        .from('properties').select('title').eq('id', topPropId).single();
      topTitle = propData?.title ?? null;
    }

    return {
      views_7d: v7Res.count ?? 0,
      views_30d: views30,
      leads_total: leads,
      active_properties: activeRes.count ?? 0,
      conversion_rate: views30 > 0 ? Math.round((leads / views30) * 100 * 10) / 10 : 0,
      top_property_title: topTitle,
      top_property_views: topViews,
    };
  } catch {
    return emptyStats();
  }
}

function emptyStats(): OverallStats {
  return { views_7d: 0, views_30d: 0, leads_total: 0, active_properties: 0, conversion_rate: 0, top_property_title: null, top_property_views: 0 };
}

export async function getPropertyAnalytics(): Promise<PropertyAnalyticsRow[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const d7  = new Date(Date.now() - 7  * 86400000).toISOString();
    const d30 = new Date(Date.now() - 30 * 86400000).toISOString();

    // Propiedades del vendedor con datos básicos
    const { data: props } = await supabase
      .from('properties')
      .select('id, title, type, location, price, image_url')
      .eq('seller_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!props || props.length === 0) return [];

    const propIds = props.map((p: any) => p.id);

    // Vistas 7d y 30d en una sola query
    const [views30Res, views7Res, leadsRes] = await Promise.all([
      supabase.from('property_views').select('property_id').in('property_id', propIds).gte('created_at', d30),
      supabase.from('property_views').select('property_id').in('property_id', propIds).gte('created_at', d7),
      supabase.from('leads').select('property_id').in('property_id', propIds),
    ]);

    // Contar por property_id
    function countByProp(rows: { property_id: string }[] | null): Record<string, number> {
      const c: Record<string, number> = {};
      for (const r of rows ?? []) { c[r.property_id] = (c[r.property_id] ?? 0) + 1; }
      return c;
    }

    const v30 = countByProp(views30Res.data);
    const v7  = countByProp(views7Res.data);
    const lc  = countByProp(leadsRes.data);

    return props.map((p: any): PropertyAnalyticsRow => {
      const views30 = v30[p.id] ?? 0;
      const leads   = lc[p.id] ?? 0;
      return {
        property_id: p.id,
        title: p.title,
        type: p.type,
        location: p.location,
        price: p.price,
        image_url: p.image_url ?? '',
        views_7d: v7[p.id] ?? 0,
        views_30d: views30,
        leads_total: leads,
        conversion_rate: views30 > 0 ? Math.round((leads / views30) * 100 * 10) / 10 : 0,
      };
    }).sort((a, b) => b.views_30d - a.views_30d);
  } catch {
    return [];
  }
}

export async function getViewsTrend30d(): Promise<ViewsTrendPoint[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const d30 = new Date(Date.now() - 30 * 86400000).toISOString();

    const { data: props } = await supabase
      .from('listings').select('id').eq('seller_id', user.id);
    const propIds = (props ?? []).map((p: any) => p.id);
    if (propIds.length === 0) return buildEmptyTrend();

    const { data } = await supabase
      .from('property_views')
      .select('created_at')
      .in('property_id', propIds)
      .gte('created_at', d30)
      .order('created_at', { ascending: true });

    // Agrupar por fecha
    const byDate: Record<string, number> = {};
    for (const row of data ?? []) {
      const day = row.created_at.slice(0, 10);
      byDate[day] = (byDate[day] ?? 0) + 1;
    }

    // Rellenar los 30 días aunque no haya datos
    const points: ViewsTrendPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key, views: byDate[key] ?? 0 });
    }
    return points;
  } catch {
    return buildEmptyTrend();
  }
}

function buildEmptyTrend(): ViewsTrendPoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return { date: d.toISOString().slice(0, 10), views: 0 };
  });
}
