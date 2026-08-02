import type { OverallStats } from '@/lib/supabase/analytics-actions';
import type { DashboardLead, DashboardPlan, DashboardUser } from '@/lib/seller/fetch-dashboard';
import type { V2Property } from '@/lib/property-adapter';

export type ListingRow = V2Property & { views: number; leads: number };

export type DashboardClientProps = {
  user: DashboardUser;
  stats: OverallStats;
  recentLeads: DashboardLead[];
  unreadLeads: number;
  listings: ListingRow[];
  plan: DashboardPlan;
};
