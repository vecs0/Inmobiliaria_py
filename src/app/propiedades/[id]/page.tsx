export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { PublicChrome } from '@/components/PublicChrome';
import { DetailClient } from '@/components/v2/DetailClient';
import { getPropertyById } from '@/lib/supabase/actions';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const property = await getPropertyById(id);

  if (!property) {
    return {
      title: 'Propiedad no encontrada | InmobiliariaPY',
      description: 'La propiedad que buscas no existe o no está disponible.',
    };
  }

  const title = property.title || 'Propiedad premium';
  const city = property.city || property.location || 'Paraguay';
  const type = property.type || 'Propiedad';
  const operation = property.operation_type === 'alquiler' ? 'Alquiler' : 'Venta';
  const price = property.price ? `${property.currency || 'USD'} ${Number(property.price).toLocaleString('es-PY')}` : 'Precio a consultar';
  const description = property.description 
    ? `${property.description.substring(0, 160)}...`
    : `${type} en ${operation} en ${city}. Propiedad premium con características exclusivas.`;

  const images = Array.isArray(property.images) && property.images.length > 0 
    ? property.images 
    : [];

  return {
    title: `${title} | ${operation} ${city} | InmobiliariaPY`,
    description,
    openGraph: {
      title: `${title} - ${price}`,
      description,
      type: 'website',
      locale: 'es_PY',
      images: images.length > 0 ? images.map((img: string) => ({
        url: img,
        width: 1200,
        height: 630,
        alt: title,
      })) : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${price}`,
      description,
      images: images.length > 0 ? [images[0]] : [],
    },
    alternates: {
      canonical: `/propiedades/${id}`,
    },
  };
}

export default async function PropiedadDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const property = await getPropertyById(id);

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <DetailClient propertyId={id} property={property} />
      </PublicChrome>
    </main>
  );
}
