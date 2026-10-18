import type { PropertyFull } from '@/lib/supabase/types';

/** Imágenes placeholder cuando el listing no tiene fotos (solo visual, no datos). */
const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
];

export type V2Property = {
  id: string;
  external_id?: string | null;
  type: string;
  operation_type: 'venta' | 'alquiler';
  title: string;
  description?: string;
  neighborhood?: string;
  city?: string;
  zone_slug?: string;
  loc: string;
  price: string;
  priceFormatted: string;
  priceN: number;
  currency: 'USD' | 'PYG';
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  beds: number;
  baths: number;
  m2: number;
  parking?: number;
  year_built?: number | null;
  floor?: number | null;
  img: string;
  image?: string;
  status?: string;
  source?: string;
  featured?: boolean | string;
  boosted?: boolean;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_whatsapp?: string | null;
  agent_email?: string | null;
  agent_photo?: string | null;
  agent_title?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[];
  amenities?: string[];
  created_at?: string | null;
  seller_profile_id?: string | null;
};

export function formatPrice(amount: number, currency: 'USD' | 'PYG' = 'USD'): string {
  if (currency === 'PYG') return `Gs ${(amount / 1_000_000).toLocaleString('es-PY')}M`;
  return `USD ${amount.toLocaleString('es-PY')}`;
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Mapea fila de `properties_full` (o resultados RPC) al shape que usa la UI v2. */
export function mapPropertyFromApi(row: Record<string, unknown>): V2Property {
  const rawId = String(row.id ?? row.listing_id ?? row.property_id ?? '');
  const fallbackIdx = Math.abs(rawId.charCodeAt(0) || 0) % FALLBACK_IMGS.length;
  const images = ((row.images as string[] | undefined) ?? []).filter(Boolean);
  const imageUrl =
    (row.image as string) ||
    (row.image_url as string) ||
    images[0] ||
    FALLBACK_IMGS[fallbackIdx];

  const currency = (row.currency as 'USD' | 'PYG') || 'USD';
  const priceN = Number(row.price ?? 0);
  const priceFormatted = priceN > 0 ? formatPrice(priceN, currency) : 'Consultar';
  const bedrooms = Number(row.bedrooms ?? row.beds ?? 0);
  const bathrooms = Number(row.bathrooms ?? row.baths ?? 0);
  const sqm = Math.round(Number(row.sqm ?? row.m2 ?? 0));
  const city = (row.city as string) || '';
  const neighborhood = (row.neighborhood as string) || '';
  const loc =
    (row.loc as string) ||
    [neighborhood, city].filter(Boolean).join(', ') ||
    (row.location as string) ||
    'Paraguay';

  return {
    // id = UUID del listing (canónico). external_id queda solo como referencia visible.
    id: rawId,
    external_id: (row.external_id as string) ?? null,
    type: (row.type as string) || 'Propiedad',
    operation_type: (row.operation_type as 'venta' | 'alquiler') || 'venta',
    title: (row.title as string) || 'Propiedad en Paraguay',
    description: (row.description as string) || '',
    neighborhood,
    city,
    zone_slug: row.zone_slug as string | undefined,
    loc,
    price: priceFormatted,
    priceFormatted,
    priceN,
    currency,
    bedrooms,
    bathrooms,
    sqm,
    beds: bedrooms,
    baths: bathrooms,
    m2: sqm,
    parking: toNum(row.parking) ?? undefined,
    year_built: toNum(row.year_built ?? row.yearBuilt),
    floor: toNum(row.floor),
    img: imageUrl,
    image: imageUrl,
    status: (row.status as string) || 'active',
    source: row.source as string | undefined,
    featured: row.featured as boolean | string | undefined,
    boosted: Boolean(row.boosted),
    agent_name: (row.agent_name as string) ?? null,
    agent_phone: (row.agent_phone as string) ?? null,
    agent_whatsapp: (row.agent_whatsapp as string) ?? null,
    agent_email: (row.agent_email as string) ?? null,
    agent_photo: (row.agent_photo as string) ?? null,
    agent_title: (row.agent_title as string) ?? null,
    latitude: toNum(row.latitude),
    longitude: toNum(row.longitude),
    images: images.length ? images : [imageUrl],
    amenities: Array.isArray(row.amenities) ? (row.amenities as string[]) : [],
    created_at: (row.created_at as string) ?? null,
    seller_profile_id: (row.seller_profile_id as string) ?? null,
  };
}

export function mapPropertiesFromApi(rows: Record<string, unknown>[]): V2Property[] {
  return rows.map(mapPropertyFromApi);
}

/** URL pública de la ficha: siempre por UUID del listing. */
export function getPropertyPath(p: { id: string; external_id?: string | null }): string {
  return `/propiedades/${encodeURIComponent(p.id || p.external_id || '')}`;
}

/** Referencia corta para UI: external_id o primeros 8 caracteres del UUID. */
export function getPropertyRef(p: { id: string; external_id?: string | null }): string {
  return p.external_id?.trim() || (p.id ? p.id.slice(0, 8).toUpperCase() : '');
}

export function mapPropertyFull(row: PropertyFull): V2Property {
  return mapPropertyFromApi(row as unknown as Record<string, unknown>);
}
