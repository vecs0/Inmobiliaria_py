'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type Result = { ok: boolean; error?: string };

const ROLES = ['user', 'seller', 'seller_empresa', 'agent', 'admin'] as const;
const LISTING_STATUSES = ['active', 'paused', 'suspended'] as const;

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return profile?.role === 'admin' ? user.id : null;
}

export async function setListingStatusAdmin(listingId: string, status: string): Promise<Result> {
  const adminId = await requireAdmin();
  if (!adminId) return { ok: false, error: 'No autorizado' };
  if (!(LISTING_STATUSES as readonly string[]).includes(status)) return { ok: false, error: 'Estado inválido' };
  const { error } = await createAdminClient().from('listings').update({ status }).eq('id', listingId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/properties');
  return { ok: true };
}

export async function setUserRole(userId: string, role: string): Promise<Result> {
  const adminId = await requireAdmin();
  if (!adminId) return { ok: false, error: 'No autorizado' };
  if (!(ROLES as readonly string[]).includes(role)) return { ok: false, error: 'Rol inválido' };
  if (userId === adminId && role !== 'admin') return { ok: false, error: 'No puedes quitarte tu propio rol de admin' };
  const { error } = await createAdminClient().from('profiles').update({ role }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/users');
  return { ok: true };
}
