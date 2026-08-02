export const dynamic = 'force-dynamic';

import { PublicChrome } from '@/components/PublicChrome';
import { ListingClient } from '@/components/v2/ListingClient';
import { getProperties } from '@/lib/supabase/actions';

interface SearchParams {
  ciudad?: string;
  tipo?: string;
  q?: string;
  operacion?: string;
  precio_min?: string;
  precio_max?: string;
  dormitorios?: string;
  page?: string;
}

export default async function PropiedadesPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page ?? '1');
  const pageSize = 20;

  const { data: properties, total } = await getProperties(
    {
      ciudad: searchParams.ciudad || searchParams.q,
      tipo: searchParams.tipo,
      precioMax: searchParams.precio_max ? Number(searchParams.precio_max) : undefined,
      featured: searchParams.q === 'destacado' ? true : undefined,
    },
    { page, pageSize }
  );

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <ListingClient properties={properties} total={total} searchParams={searchParams} />
      </PublicChrome>
    </main>
  );
}
