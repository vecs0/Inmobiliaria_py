'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SellerProfileSchema = z.object({
  accountType: z.enum(['particular', 'empresa']),
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).optional().default(''),
  cedula: z.string().trim().max(30).optional(),
  companyName: z.string().trim().max(160).optional(),
  ruc: z.string().trim().max(30).optional(),
  hasWebsite: z.boolean().optional().default(false),
  websiteUrl: z.string().trim().max(300).optional(),
});

export interface SellerProfileData {
  /** @deprecated Ignorado: el user_id se toma de la sesión (supabase.auth.getUser()). */
  userId?: string;
  accountType: 'particular' | 'empresa';
  fullName: string;
  phone: string;
  cedula?: string;
  companyName?: string;
  ruc?: string;
  hasWebsite: boolean;
  websiteUrl?: string;
}

export async function createSellerProfile(input: SellerProfileData): Promise<{ success: boolean; error?: string }> {
  const parsed = SellerProfileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Datos de perfil inválidos.' };
  const data = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado.' };

  try {
    // Idempotente: si ya existe un perfil de vendedor, no crear otro
    const { data: existing } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) return { success: true };

    const { error: profileError } = await supabase.from('seller_profiles').insert({
      user_id: user.id,
      seller_type: data.accountType,
      full_name: data.fullName,
      phone: data.phone || null,
      cedula: data.cedula || null,
      company_name: data.accountType === 'empresa' ? data.companyName || data.fullName : null,
      ruc: data.accountType === 'empresa' ? data.ruc || null : null,
      ruc_verified: false,
      has_website: data.hasWebsite,
      website_url: data.websiteUrl || null,
      subscription_plan: 'trial',
      subscription_status: 'inactive',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (profileError) {
      console.error('Error creating seller profile:', profileError);
      return { success: false, error: profileError.message };
    }

    revalidatePath('/vendedor');
    return { success: true };
  } catch (error: unknown) {
    console.error('Unexpected error creating seller profile:', error);
    return { success: false, error: 'Ocurrió un error inesperado al crear el perfil.' };
  }
}

export async function updateSellerProfile(data: {
  full_name: string;
  phone: string;
  avatar_url: string;
  company_name: string;
  ruc: string;
  website_url: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado.' };

  try {
    // Actualizar profiles (datos del usuario)
    const { error: profErr } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name || null,
        phone: data.phone || null,
        avatar_url: data.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profErr) throw profErr;

    // Actualizar seller_profiles (datos comerciales)
    const { error: sellErr } = await supabase
      .from('seller_profiles')
      .update({
        full_name: data.full_name || null,
        phone: data.phone || null,
        company_name: data.company_name || null,
        ruc: data.ruc || null,
        website_url: data.website_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (sellErr) throw sellErr;

    revalidatePath('/vendedor/perfil');
    return { success: true };
  } catch (err: unknown) {
    const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Error al guardar.';
    return { success: false, error: msg };
  }
}
