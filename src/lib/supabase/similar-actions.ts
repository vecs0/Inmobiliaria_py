'use server';

import { createClient } from './server';

export interface SimilarProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  images: string[];
  featured: boolean;
  similarity?: number;
}

/**
 * Busca propiedades similares a una dada.
 * Estrategia:
 *  1. Intenta usar RPC similar_properties (pgvector — requiere embeddings generados)
 *  2. Si no hay embeddings, fallback a filtro por tipo + rango de precio ±40%
 *  3. Fallback amplio: solo precio ±60%
 */
export async function getSimilarProperties(
  propertyId: string,
  property: { type: string; price: number; location: string; bedrooms: number }
): Promise<SimilarProperty[]> {
  try {
    const supabase = await createClient();

    // Intentar con pgvector RPC
    const { data: vectorData, error: vectorErr } = await supabase
      .rpc('similar_properties', {
        source_property_id: propertyId,
        match_count: 4,
      });

    if (!vectorErr && vectorData && vectorData.length > 0) {
      return vectorData as SimilarProperty[];
    }

    // Fallback: filtro por tipo + precio ±40%
    const priceMin = property.price * 0.6;
    const priceMax = property.price * 1.4;

    const { data: fallbackData } = await supabase
      .from('properties')
      .select('id, title, location, price, type, bedrooms, bathrooms, sqm, images, featured')
      .eq('status', 'active')
      .eq('type', property.type)
      .neq('id', propertyId)
      .gte('price', priceMin)
      .lte('price', priceMax)
      .limit(6);

    if (fallbackData && fallbackData.length >= 3) {
      return fallbackData as SimilarProperty[];
    }

    // Fallback más amplio: solo precio ±60%
    const { data: broadData } = await supabase
      .from('properties')
      .select('id, title, location, price, type, bedrooms, bathrooms, sqm, images, featured')
      .eq('status', 'active')
      .neq('id', propertyId)
      .gte('price', property.price * 0.4)
      .lte('price', property.price * 1.6)
      .limit(4);

    return (broadData as SimilarProperty[]) ?? [];
  } catch {
    return [];
  }
}

export interface SemanticSearchResult {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  images: string[];
  featured: boolean;
  similarity: number;
}
