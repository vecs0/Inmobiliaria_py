import type { PropertyFull } from '@/lib/supabase/types';

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
};

export function formatPrice(amount: number, currency: 'USD' | 'PYG' = 'USD'): string {
  if (currency === 'PYG') return `Gs ${(amount / 1_000_000).toLocaleString('es-PY')}M`;
  return `USD ${amount.toLocaleString('es-PY')}`;
}

/** Mapea fila de `properties_full` o mock al shape que usa la UI v2. */
export function mapPropertyFromApi(row: Record<string, unknown>): V2Property {
  const fallbackIdx = Math.abs(String(row.id ?? '0').charCodeAt(0)) % FALLBACK_IMGS.length;
  const images = (row.images as string[] | undefined) ?? [];
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
  const city = (row.city as string) || 'Asunción';
  const neighborhood = (row.neighborhood as string) || '';
  const loc =
    (row.loc as string) ||
    (row.location as string) ||
    [neighborhood, city].filter(Boolean).join(', ') ||
    city;

  return {
    id: String(row.external_id ?? row.id ?? 'PY-0000'),
    external_id: (row.external_id as string) ?? (row.id as string) ?? null,
    type: (row.type as string) || 'Casa',
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
    parking: row.parking != null ? Number(row.parking) : undefined,
    year_built: (row.year_built ?? row.yearBuilt) as number | null | undefined,
    floor: row.floor as number | null | undefined,
    img: imageUrl,
    image: imageUrl,
    status: (row.status as string) || 'active',
    source: row.source as string | undefined,
    featured: row.featured as boolean | string | undefined,
    boosted: Boolean(row.boosted),
    agent_name: row.agent_name as string | null,
    agent_phone: row.agent_phone as string | null,
    agent_whatsapp: row.agent_whatsapp as string | null,
    agent_email: row.agent_email as string | null,
    agent_photo: row.agent_photo as string | null,
    agent_title: row.agent_title as string | null,
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    images: images.length ? images : [imageUrl],
  };
}

export function mapPropertiesFromApi(rows: Record<string, unknown>[]): V2Property[] {
  return rows.map(mapPropertyFromApi);
}

/** Slug público para URLs: external_id (PY-0241) o UUID. */
export function getPropertyPath(p: { id: string; external_id?: string | null }): string {
  const slug = p.external_id?.trim() || p.id;
  return `/propiedades/${encodeURIComponent(slug)}`;
}

export function mapPropertyFull(row: PropertyFull): V2Property {
  return mapPropertyFromApi(row as unknown as Record<string, unknown>);
}
