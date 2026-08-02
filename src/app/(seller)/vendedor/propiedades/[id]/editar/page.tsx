export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/roles';
import { NuevaPropertyClient } from '@/components/v2/NuevaPropertyClient';

export default async function EditarPropiedadPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login');

  const supabase = await createClient();

  // Cargar listing con entidad física
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      id, title, description, price, currency, operation_type,
      images, amenities, status,
      seller_profile_id,
      seller_profiles!inner(user_id),
      property_entities(
        id, city, neighborhood, address, type,
        bedrooms, bathrooms, sqm, parking
      )
    `)
    .eq('id', params.id)
    .maybeSingle();

  if (error || !listing) notFound();

  // Verificar propiedad del vendedor autenticado
  const profile = listing.seller_profiles as unknown as { user_id: string };
  if (profile.user_id !== ctx.userId) redirect('/vendedor/propiedades');

  const entity = Array.isArray(listing.property_entities)
    ? listing.property_entities[0]
    : listing.property_entities;

  const imageList: string[] = Array.isArray(listing.images) ? listing.images as string[] : [];
  const amenityList: string[] = Array.isArray(listing.amenities) ? listing.amenities as string[] : [];

  const initialData = {
    title: listing.title ?? '',
    description: listing.description ?? '',
    price: String(listing.price ?? ''),
    currency: (listing.currency as 'USD' | 'PYG') ?? 'USD',
    operation_type: (listing.operation_type as 'venta' | 'alquiler') ?? 'venta',
    images: imageList,
    amenities: amenityList,
    // Datos de la entidad física
    type: entity?.type ?? '',
    city: entity?.city ?? '',
    neighborhood: entity?.neighborhood ?? '',
    address: entity?.address ?? '',
    bedrooms: entity?.bedrooms ?? 1,
    bathrooms: entity?.bathrooms ?? 1,
    sqm: String(entity?.sqm ?? ''),
    sqm_built: '',
    garage: (entity?.parking ?? 0) > 0,
    department: '',
  };

  return (
    <NuevaPropertyClient
      sellerProfileId={listing.seller_profile_id}
      listingId={listing.id}
      initialData={initialData}
    />
  );
}
