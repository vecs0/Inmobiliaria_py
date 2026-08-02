export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { NuevaPropertyClient } from '@/components/v2/NuevaPropertyClient';
import { createClient } from '@/lib/supabase/server';

export default async function NuevaPropiedadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id, max_properties, properties_count')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller) redirect('/vendedor');

  if (seller.properties_count >= seller.max_properties) {
    redirect('/vendedor/propiedades?limit=true');
  }

  return <NuevaPropertyClient sellerProfileId={seller.id} />;
}
