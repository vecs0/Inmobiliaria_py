export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicChrome } from '@/components/PublicChrome';
import { DetailClient } from '@/components/v2/DetailClient';
import { getPropertyById } from '@/lib/supabase/actions';
import { getSimilarProperties } from '@/lib/supabase/similar-actions';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Params): Promise<Metadata> {
  const { id } = await props.params;
  const property = await getPropertyById(id);

  if (!property) {
    return {
      title: 'Propiedad no encontrada | InmobiliariaPY',
      description: 'La propiedad que buscás no existe o no está disponible.',
      robots: { index: false },
    };
  }

  const title = property.title || 'Propiedad';
  const city = property.city || property.location || 'Paraguay';
  const type = property.type || 'Propiedad';
  const operation = property.operation_type === 'alquiler' ? 'Alquiler' : 'Venta';
  const price = property.price
    ? `${property.currency || 'USD'} ${Number(property.price).toLocaleString('es-PY')}`
    : 'Precio a consultar';
  const description = property.description
    ? `${String(property.description).substring(0, 160)}…`
    : `${type} en ${operation.toLowerCase()} en ${city}.`;
  const images: string[] = Array.isArray(property.images) ? property.images.filter(Boolean) : [];

  return {
    title: `${title} | ${operation} ${city} | InmobiliariaPY`,
    description,
    openGraph: {
      title: `${title} - ${price}`,
      description,
      type: 'website',
      locale: 'es_PY',
      images: images.map((img) => ({ url: img, width: 1200, height: 630, alt: title })),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${price}`,
      description,
      images: images.length > 0 ? [images[0]] : [],
    },
    alternates: { canonical: `/propiedades/${property.id ?? id}` },
  };
}

async function loadSimilar(property: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  const id = String(property.id);
  try {
    const vec = await getSimilarProperties(id, {
      type: String(property.type ?? ''),
      price: Number(property.price ?? 0),
      location: String(property.location ?? property.city ?? ''),
      bedrooms: Number(property.bedrooms ?? 0),
    });
    const filtered = (vec ?? []).filter((s) => s && String(s.id) !== id);
    if (filtered.length > 0) return filtered as unknown as Record<string, unknown>[];
  } catch {
    /* fallback abajo */
  }

  // Fallback: publicaciones recientes de la misma ciudad
  const supabase = await createClient();
  let q = supabase.from('properties_full').select('*').eq('status', 'active').neq('id', id);
  if (property.city) q = q.eq('city', String(property.city));
  const { data } = await q.order('created_at', { ascending: false }).limit(8);
  return (data ?? []) as Record<string, unknown>[];
}

export default async function PropiedadDetailPage(props: Params) {
  const { id } = await props.params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const similar = await loadSimilar(property as Record<string, unknown>);

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <DetailClient property={property as Record<string, unknown>} similarProperties={similar} />
      </PublicChrome>
    </main>
  );
}
