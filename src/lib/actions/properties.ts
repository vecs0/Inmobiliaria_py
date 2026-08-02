'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PropertyEntity, Listing } from '@/lib/supabase/types';

export interface CreatePropertyInput {
  // Datos de la entidad física
  city: string;
  neighborhood: string;
  address: string;
  latitude: number;
  longitude: number;
  type: PropertyEntity['type'];
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
  year_built?: number;
  floor?: number;

  // Datos comerciales del listing
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'PYG';
  operation_type: 'venta' | 'alquiler';
  image: string;
  images: string[];
  amenities: string[];
  tag?: string;
  featured: boolean;

  // Vendedor
  seller_profile_id: string;
}

export async function createListing(data: CreatePropertyInput) {
  const supabase = await createClient();

  try {
    // 1. Verificar límite de propiedades del vendedor
    const { data: profile, error: profileError } = await supabase
      .from('seller_profiles')
      .select('max_properties, properties_count')
      .eq('id', data.seller_profile_id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Perfil de vendedor no encontrado.' };
    }

    if (profile.properties_count >= profile.max_properties) {
      return { success: false, error: 'Has alcanzado el límite de propiedades de tu plan.' };
    }

    // 2. Deduplicación: Buscar si ya existe una entidad física similar
    // Basado en ciudad, barrio, m2 y habitaciones (margen de error mínimo)
    const { data: existingEntity, error: entityError } = await supabase
      .from('property_entities')
      .select('id')
      .eq('city', data.city)
      .eq('neighborhood', data.neighborhood)
      .eq('sqm', data.sqm)
      .eq('bedrooms', data.bedrooms)
      .maybeSingle();

    let entityId: string;

    if (existingEntity) {
      entityId = existingEntity.id;
    } else {
      // 3. Crear nueva entidad física si no existe
      const { data: newEntity, error: createEntityError } = await supabase
        .from('property_entities')
        .insert({
          city: data.city,
          neighborhood: data.neighborhood,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          type: data.type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          sqm: data.sqm,
          parking: data.parking,
          year_built: data.year_built,
          floor: data.floor,
        })
        .select()
        .single();

      if (createEntityError) throw createEntityError;
      entityId = newEntity.id;
    }

    // 4. Crear el listing comercial vinculado a la entidad
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        entity_id: entityId,
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        operation_type: data.operation_type,
        image: data.image,
        images: data.images,
        amenities: data.amenities,
        tag: data.tag,
        featured: data.featured,
        seller_profile_id: data.seller_profile_id,
        status: 'active',
        source: 'direct'
      })
      .select()
      .single();

    if (listingError) throw listingError;

    // 5. Incrementar el contador de propiedades en el perfil del vendedor
    await supabase.rpc('increment_properties_count', {
      profile_id: data.seller_profile_id
    });

    revalidatePath('/vendedor');
    return { success: true, listingId: listing.id, entityId };

  } catch (error: any) {
    console.error('Error in createListing:', error);
    return { success: false, error: error.message || 'Error interno al crear la propiedad.' };
  }
}

export interface UpdatePropertyInput {
  listingId: string;
  // Datos comerciales actualizables
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'PYG';
  operation_type: 'venta' | 'alquiler';
  image: string;
  images: string[];
  amenities: string[];
  status?: string;
  // Datos de ubicación
  city: string;
  neighborhood: string;
  address: string;
  // Características
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
}

export async function updateListing(data: UpdatePropertyInput) {
  const supabase = await createClient();

  try {
    // 1. Verificar que el listing pertenece al usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado.' };

    const { data: existing, error: fetchErr } = await supabase
      .from('listings')
      .select('id, entity_id, seller_profile_id, seller_profiles!inner(user_id)')
      .eq('id', data.listingId)
      .maybeSingle();

    if (fetchErr || !existing) return { success: false, error: 'Propiedad no encontrada.' };

    // Verificar propiedad del vendedor
    const profile = existing.seller_profiles as unknown as { user_id: string };
    if (profile.user_id !== user.id) return { success: false, error: 'No autorizado.' };

    // 2. Actualizar listing comercial
    const { error: listingErr } = await supabase
      .from('listings')
      .update({
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        operation_type: data.operation_type,
        image: data.image,
        images: data.images,
        amenities: data.amenities,
        ...(data.status ? { status: data.status } : {}),
      })
      .eq('id', data.listingId);

    if (listingErr) throw listingErr;

    // 3. Actualizar entidad física si existe
    if (existing.entity_id) {
      await supabase
        .from('property_entities')
        .update({
          city: data.city,
          neighborhood: data.neighborhood,
          address: data.address,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          sqm: data.sqm,
          parking: data.parking,
        })
        .eq('id', existing.entity_id);
    }

    revalidatePath('/vendedor/propiedades');
    revalidatePath(`/propiedades/${data.listingId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Error in updateListing:', error);
    return { success: false, error: error.message || 'Error interno al actualizar.' };
  }
}

export async function getPropertiesByIds(ids: string[]) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('properties_full')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error in getPropertiesByIds:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
