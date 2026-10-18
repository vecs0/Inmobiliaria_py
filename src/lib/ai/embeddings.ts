import { createAdminClient } from '@/lib/supabase/admin';
import { getOpenAI } from '@/lib/openai';

export const EMBEDDING_MODEL = 'text-embedding-3-small';

interface ListingWithEntity {
  title: string | null;
  description: string | null;
  operation_type: string | null;
  price: number | null;
  currency: string | null;
  amenities: string[] | null;
  property_entities?: {
    type: string | null;
    city: string | null;
    neighborhood: string | null;
    address: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    sqm: number | null;
  } | null;
}

export function buildListingText(l: ListingWithEntity): string {
  const e = l.property_entities ?? null;
  return [
    l.title,
    e?.type,
    e?.neighborhood,
    e?.city,
    e?.address,
    l.description,
    e && (e.bedrooms ?? 0) > 0 ? `${e.bedrooms} habitaciones` : '',
    e && (e.bathrooms ?? 0) > 0 ? `${e.bathrooms} baños` : '',
    e && (e.sqm ?? 0) > 0 ? `${e.sqm} metros cuadrados` : '',
    l.price ? `precio ${l.price} ${l.currency ?? 'USD'}` : '',
    l.operation_type === 'alquiler' ? 'en alquiler' : 'en venta',
    ...(l.amenities ?? []),
  ]
    .filter(Boolean)
    .join('. ')
    .slice(0, 8000);
}

/**
 * Genera y guarda listings.embedding. No lanza si falta OPENAI_API_KEY (no-op con warning).
 * Devuelve true si se escribió el embedding.
 */
export async function generateListingEmbedding(listingId: string): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[embeddings] OPENAI_API_KEY no configurada; se omite el embedding');
    return false;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('listings')
    .select(
      'title, description, operation_type, price, currency, amenities, property_entities(type, city, neighborhood, address, bedrooms, bathrooms, sqm)',
    )
    .eq('id', listingId)
    .maybeSingle();
  if (error || !data) {
    console.error('[embeddings] listing no encontrado', listingId, error?.message);
    return false;
  }

  const row = data as unknown as ListingWithEntity & { property_entities?: unknown };
  // Supabase puede devolver la relación como objeto o array según la FK
  if (Array.isArray(row.property_entities)) row.property_entities = row.property_entities[0] ?? null;

  const res = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: buildListingText(row),
  });
  const embedding = res.data[0].embedding;

  const { error: upErr } = await admin.from('listings').update({ embedding }).eq('id', listingId);
  if (upErr) {
    console.error('[embeddings] error guardando embedding', upErr.message);
    return false;
  }
  return true;
}
