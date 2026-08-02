'use server';

import { properties, agents, cities as dataCities, propertyTypes as dataPropertyTypes } from '../data';
import { revalidateTag } from 'next/cache';
import { createClient } from './server';

export interface PropertyFilters {
  ciudad?: string;
  tipo?: string;
  precioMax?: number;
  bedsMin?: number;
  featured?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getProperties(
  filters: PropertyFilters = {},
  options: { page?: number; pageSize?: number; revalidate?: boolean } = {}
): Promise<PaginatedResponse<any>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('properties_full')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    if (filters.ciudad) {
      query = query.ilike('city', `%${filters.ciudad}%`);
    }
    if (filters.tipo) {
      query = query.eq('type', filters.tipo);
    }
    if (filters.precioMax) {
      query = query.lte('price', filters.precioMax);
    }
    if (filters.bedsMin) {
      query = query.gte('bedrooms', filters.bedsMin);
    }
    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    const { page = 1, pageSize = 9 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching properties list:', error);
      return { data: [], total: 0, page, pageSize, hasMore: false };
    }

    return {
      data: data ?? [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > from + pageSize,
    };
  } catch (err) {
    console.error('Error fetching properties:', err);
    return { data: [], total: 0, page: 1, pageSize: 9, hasMore: false };
  }
}

export async function getPropertyById(id: string) {
  try {
    const supabase = await createClient();
    
    // Validar si el ID provisto es un UUID de Postgres válido antes de consultar por ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      const byUuid = await supabase
        .from('properties_full')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .maybeSingle();

      if (byUuid.data) return byUuid.data;
      if (byUuid.error && byUuid.error.code !== 'PGRST116') {
        console.error('Error fetching property by UUID:', byUuid.error);
      }
    }

    // Si no es un UUID válido o no se encontró por ID, buscar por external_id
    const byExternal = await supabase
      .from('properties_full')
      .select('*')
      .eq('external_id', id)
      .eq('status', 'active')
      .maybeSingle();

    if (byExternal.error && byExternal.error.code !== 'PGRST116') {
      console.error('Error fetching property by external_id:', byExternal.error);
      return null;
    }
    return byExternal.data;
  } catch (err) {
    console.error('Error fetching property:', err);
    return null;
  }
}

export async function getFeaturedProperties(limit = 6) {
  try {
    const supabase = await createClient();

    // 1. Obtener los IDs de propiedades con plan de boost activo (destacados de pago)
    const { data: activeBoosts, error: boostError } = await supabase
      .from('property_boosts')
      .select('property_id')
      .eq('status', 'active');

    if (boostError) {
      console.error('Error fetching active boosts:', boostError);
    }

    const boostedIds = activeBoosts?.map((b) => b.property_id).filter(Boolean) || [];

    // 2. Construir consulta de propiedades
    let query = supabase
      .from('properties_full')
      .select('*')
      .eq('status', 'active');

    // Si hay propiedades con boost activo, traemos destacadas tradicionales OR propiedades con boost
    if (boostedIds.length > 0) {
      const formattedIds = boostedIds.map((id) => `"${id}"`).join(',');
      query = query.or(`featured.eq.true,id.in.(${formattedIds})`);
    } else {
      // Si no hay boosts, traemos solo las destacadas (featured = true)
      query = query.eq('featured', true);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured properties:', error);
      return [];
    }

    // 3. Mapear los resultados agregando la propiedad 'boosted' dinámicamente
    const results = (data ?? []).map((item) => ({
      ...item,
      boosted: boostedIds.includes(item.id || ''),
    }));

    return results;
  } catch (err) {
    console.error('Error fetching featured properties:', err);
    return [];
  }
}

export async function getCities() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('properties')
      .select('location')
      .eq('status', 'active');
    if (error || !data) return [...dataCities];
    const unique = Array.from(new Set(data.map((r: any) => r.location).filter(Boolean))).sort();
    return unique.length > 0 ? unique : [...dataCities];
  } catch {
    return [...dataCities];
  }
}

export async function getPropertyTypes() {
  return [...dataPropertyTypes];
}

export async function getAgents() {
  return [...agents];
}

export interface DashboardStats {
  activeProperties: number;
  featuredProperties: number;
  pendingProperties: number;
}

export async function getStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    const [activeRes, featuredRes, pendingRes] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('featured', true),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    return {
      activeProperties: activeRes.count ?? 0,
      featuredProperties: featuredRes.count ?? 0,
      pendingProperties: pendingRes.count ?? 0,
    };
  } catch {
    return { activeProperties: 0, featuredProperties: 0, pendingProperties: 0 };
  }
}

export async function revalidateProperties() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (revalidateTag as any)('properties');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (revalidateTag as any)('featured-properties');
}

export async function createProperty(property: any) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('properties')
      .insert([property])
      .select()
      .single();

    if (error) throw error;
    await revalidateProperties();
    return data;
  } catch (err) {
    console.error('Error creating property:', err);
    throw err;
  }
}

export async function updateProperty(id: string, updates: any) {
  try {
    const supabase = await createClient();
    // Actualizamos la tabla 'listings' ya que el ID de la vista es el ID del listing
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await revalidateProperties();
    return data;
  } catch (err) {
    console.error('Error updating property listing:', err);
    throw err;
  }
}

export async function deleteProperty(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
