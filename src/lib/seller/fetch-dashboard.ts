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

export async function fetchSellerShellContext(): Promise<{
  plan: DashboardPlan;
  unreadLeads: number;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('max_properties, subscription_plan, seller_type')
    .eq('user_id', user.id)
    .maybeSingle();

  const maxCount = sellerProfile?.max_properties ?? (sellerProfile?.seller_type === 'empresa' ? 50 : 5);
  const planLabel = formatPlanLabel(sellerProfile?.seller_type, sellerProfile?.subscription_plan);

  const [stats, leadsRes] = await Promise.all([
    getOverallStats(),
    supabase.from('leads').select('is_read').eq('seller_id', user.id).eq('is_read', false).limit(50),
  ]);

  return {
    plan: {
      label: planLabel,
      activeCount: stats.active_properties,
      maxCount,
    },
    unreadLeads: leadsRes.data?.length ?? 0,
  };
}

export async function fetchSellerDashboard(): Promise<SellerDashboardData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('id, max_properties, subscription_plan, seller_type')
    .eq('user_id', user.id)
    .maybeSingle();

  const sellerProfileId = sellerProfile?.id;
  const maxCount = sellerProfile?.max_properties ?? (sellerProfile?.seller_type === 'empresa' ? 50 : 5);
  const planLabel = formatPlanLabel(sellerProfile?.seller_type, sellerProfile?.subscription_plan);

  const [stats, leadsRes, listingsRes] = await Promise.all([
    getOverallStats(),
    supabase
      .from('leads')
      .select('id, name, email, phone, message, property_id, status, score, score_details, is_read, created_at, source')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
    sellerProfileId
      ? supabase
          .from('properties_full')
          .select('*')
          .eq('seller_profile_id', sellerProfileId)
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const rawLeads = leadsRes.data ?? [];
  const unreadLeads = rawLeads.filter((l) => !l.is_read).length;

  const recentLeads: DashboardLead[] = rawLeads.map((l) => ({
    id: l.id,
    name: l.name ?? 'Consulta',
    email: l.email,
    phone: l.phone,
    message: l.message ?? '',
    property_id: l.property_id,
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
  }));

  const mapped = mapPropertiesFromApi((listingsRes.data ?? []) as Record<string, unknown>[]);
  const listings = mapped.map((p) => ({
    ...p,
    views: 0,
    leads: 0,
  }));

  return {
    user: {
      name: profile?.full_name ?? user.email?.split('@')[0] ?? 'Vendedor',
      email: user.email ?? '',
      avatarUrl: profile?.avatar_url ?? undefined,
    },
    stats,
    recentLeads,
    unreadLeads,
    listings,
    plan: {
      label: planLabel,
      activeCount: stats.active_properties,
      maxCount,
    },
  };
}
