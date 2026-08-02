'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SellerProfileData {
  userId: string;
  accountType: 'particular' | 'empresa';
  fullName: string;
  phone: string;
  cedula?: string;
  companyName?: string;
  ruc?: string;
  hasWebsite: boolean;
  websiteUrl?: string;
}

export async function createSellerProfile(data: SellerProfileData) {
  const supabase = await createClient();

  try {
    const { error: profileError } = await supabase.from('seller_profiles').insert({
      user_id: data.userId,
      seller_type: data.accountType,
      full_name: data.fullName,
      phone: data.phone,
      cedula: data.cedula || null,
      company_name: data.companyName || null,
      ruc: data.ruc || null,
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
  } catch (error: any) {
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
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Error al guardar.' };
  }
}
