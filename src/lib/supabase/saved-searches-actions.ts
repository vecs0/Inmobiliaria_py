'use server';

import { createClient } from './server';
import { SavedSearch, SavedSearchFilters } from './types';

export async function getUserSavedSearches(): Promise<SavedSearch[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as SavedSearch[]) || [];
  } catch {
    return [];
  }
}

export async function createSavedSearch(
  name: string,
  filters: SavedSearchFilters
): Promise<{ success: boolean; data?: SavedSearch; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión para guardar alertas.' };

    // Máx 10 alertas por usuario
    const { count } = await supabase
      .from('saved_searches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= 10) {
      return { success: false, error: 'Límite de 10 alertas alcanzado. Elimina una para crear otra.' };
    }

    const { data, error } = await supabase
      .from('saved_searches')
      .insert([{ user_id: user.id, name: name.trim(), filters, active: true }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: data as SavedSearch };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSavedSearch(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado.' };

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleSavedSearch(
  id: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado.' };

    const { error } = await supabase
      .from('saved_searches')
      .update({ active })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
