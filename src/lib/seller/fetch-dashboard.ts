import { createClient } from '@/lib/supabase/server';
import { getOverallStats, type OverallStats } from '@/lib/supabase/analytics-actions';
import { mapPropertiesFromApi } from '@/lib/property-adapter';
import type { V2Property } from '@/lib/property-adapter';

export type DashboardLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  property_id: string | null;
  property_title?: string | null;
  status: string;
  score: number;
  score_details: string[];
  is_read: boolean;
  created_at: string;
  source: string;
};

export type DashboardUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

export type DashboardPlan = {
  label: string;
  activeCount: number;
  maxCount: number;
};

export type SellerDashboardData = {
  user: DashboardUser;
  stats: OverallStats;
  recentLeads: DashboardLead[];
  unreadLeads: number;
  listings: (V2Property & { views: number; leads: number })[];
  plan: DashboardPlan;
};

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

const LEAD_COLUMNS = 'id, name, email, phone, message, property_id, status, score, score_details, is_read, created_at, source';
const VIEWS_WINDOW_DAYS = 30;

function formatPlanLabel(sellerType?: string | null, subscriptionPlan?: string | null): string {
  const isPro = subscriptionPlan === 'pro' || subscriptionPlan === 'premium';
  if (sellerType === 'particular') {
    return isPro ? 'PARTICULAR · PRO' : 'PARTICULAR · TRIAL';
  }
  return isPro ? 'EMPRESA · PRO' : 'EMPRESA · TRIAL';
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins || 1} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

/** IDs que pueden figurar como `leads.seller_id`: seller_profile (contrato nuevo) y auth uid (legacy). */
function sellerIds(userId: string, sellerProfileId?: string | null): string[] {
  return sellerProfileId ? [sellerProfileId, userId] : [userId];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLead(l: any, titles: Map<string, string>): DashboardLead {
  return {
    id: l.id,
    name: l.name ?? 'Consulta',
    email: l.email ?? null,
    phone: l.phone ?? null,
    message: l.message ?? '',
    property_id: l.property_id ?? null,
    property_title: l.property_id ? titles.get(l.property_id) ?? null : null,
    status: l.status ?? 'pending',
    score: l.score ?? 0,
    score_details: Array.isArray(l.score_details)
      ? l.score_details
      : typeof l.score_details === 'string'
        ? [l.score_details]
        : [],
    is_read: Boolean(l.is_read),
    created_at: l.created_at ? formatRelativeTime(l.created_at) : '',
    source: l.source ?? 'Formulario',
  };
}

async function getSellerProfile(supabase: SupabaseServer, userId: string) {
  const { data } = await supabase
    .from('seller_profiles')
    .select('id, max_properties, subscription_plan, seller_type')
    .eq('user_id', userId)
    .maybeSingle();
  return data as { id: string; max_properties: number | null; subscription_plan: string | null; seller_type: string | null } | null;
}

export async function fetchSellerShellContext(): Promise<{
  plan: DashboardPlan;
  unreadLeads: number;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sellerProfile = await getSellerProfile(supabase, user.id);
  const maxCount = sellerProfile?.max_properties ?? (sellerProfile?.seller_type === 'empresa' ? 50 : 5);
  const planLabel = formatPlanLabel(sellerProfile?.seller_type, sellerProfile?.subscription_plan);

  const [activeRes, unreadRes] = await Promise.all([
    sellerProfile?.id
      ? supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('seller_profile_id', sellerProfile.id)
          .eq('status', 'active')
      : Promise.resolve({ count: 0 }),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .in('seller_id', sellerIds(user.id, sellerProfile?.id))
      .eq('is_read', false),
  ]);

  return {
    plan: { label: planLabel, activeCount: activeRes.count ?? 0, maxCount },
    unreadLeads: unreadRes.count ?? 0,
  };
}

export async function fetchSellerDashboard(): Promise<SellerDashboardData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, sellerProfile] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
    getSellerProfile(supabase, user.id),
  ]);

  const sellerProfileId = sellerProfile?.id ?? null;
  const maxCount = sellerProfile?.max_properties ?? (sellerProfile?.seller_type === 'empresa' ? 50 : 5);
  const planLabel = formatPlanLabel(sellerProfile?.seller_type, sellerProfile?.subscription_plan);
  const sIds = sellerIds(user.id, sellerProfileId);
  const since = new Date(Date.now() - VIEWS_WINDOW_DAYS * 86400000).toISOString();

  const [stats, recentLeadsRes, unreadRes, listingsRes, leadsByPropRes, viewsRes] = await Promise.all([
    getOverallStats(),
    supabase.from('leads').select(LEAD_COLUMNS).in('seller_id', sIds).order('created_at', { ascending: false }).limit(8),
    supabase.from('leads').select('id', { count: 'exact', head: true }).in('seller_id', sIds).eq('is_read', false),
    sellerProfileId
      ? supabase
          .from('properties_full')
          .select('*')
          .eq('seller_profile_id', sellerProfileId)
          .order('created_at', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    supabase.from('leads').select('property_id').in('seller_id', sIds).not('property_id', 'is', null).limit(10000),
    // property_views.seller_id = auth uid del vendedor (RLS pv_select_own)
    supabase.from('property_views').select('property_id').eq('seller_id', user.id).gte('created_at', since).limit(20000),
  ]);

  const countBy = (rows: { property_id: string | null }[] | null) => {
    const c = new Map<string, number>();
    for (const r of rows ?? []) if (r.property_id) c.set(r.property_id, (c.get(r.property_id) ?? 0) + 1);
    return c;
  };
  const leadCounts = countBy(leadsByPropRes.data as { property_id: string | null }[] | null);
  const viewCounts = countBy(viewsRes.data as { property_id: string | null }[] | null);

  const mapped = mapPropertiesFromApi((listingsRes.data ?? []) as Record<string, unknown>[]);
  const titles = new Map(mapped.map((p) => [p.id, p.title]));
  const listings = mapped.map((p) => ({
    ...p,
    views: viewCounts.get(p.id) ?? 0,
    leads: leadCounts.get(p.id) ?? 0,
  }));

  const recentLeads = (recentLeadsRes.data ?? []).map((l) => mapLead(l, titles));

  return {
    user: {
      name: profile?.full_name ?? user.email?.split('@')[0] ?? 'Vendedor',
      email: user.email ?? '',
      avatarUrl: profile?.avatar_url ?? undefined,
    },
    stats,
    recentLeads,
    unreadLeads: unreadRes.count ?? 0,
    listings,
    plan: {
      label: planLabel,
      activeCount: listings.filter((l) => l.status === 'active').length,
      maxCount,
    },
  };
}

/** Todas las consultas del vendedor, paginadas. */
export async function fetchSellerLeads(
  page = 1,
  pageSize = 20
): Promise<{ leads: DashboardLead[]; total: number; page: number; totalPages: number } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const sellerProfile = await getSellerProfile(supabase, user.id);
  const from = (Math.max(1, page) - 1) * pageSize;

  const { data, count } = await supabase
    .from('leads')
    .select(LEAD_COLUMNS, { count: 'exact' })
    .in('seller_id', sellerIds(user.id, sellerProfile?.id))
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  const rows = data ?? [];
  const propIds = Array.from(new Set(rows.map((r) => r.property_id).filter(Boolean))) as string[];
  const titles = new Map<string, string>();
  if (propIds.length) {
    const { data: props } = await supabase.from('listings').select('id, title').in('id', propIds);
    for (const p of props ?? []) titles.set(p.id, p.title);
  }

  const total = count ?? 0;
  return {
    leads: rows.map((l) => mapLead(l, titles)),
    total,
    page: Math.max(1, page),
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
