export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PerfilVendedorClient } from '@/components/v2/PerfilVendedorClient';
import type { PerfilData } from '@/components/v2/PerfilVendedorClient';

export default async function PerfilVendedorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [profileRes, sellerRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, avatar_url, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('seller_profiles')
      .select('full_name, phone, company_name, ruc, website_url, seller_type')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (!sellerRes.data) redirect('/vendedor');

  const data: PerfilData = {
    full_name: sellerRes.data.full_name ?? profileRes.data?.full_name ?? null,
    phone: sellerRes.data.phone ?? profileRes.data?.phone ?? null,
    avatar_url: profileRes.data?.avatar_url ?? null,
    email: profileRes.data?.email ?? user.email ?? '',
    company_name: sellerRes.data.company_name ?? null,
    ruc: sellerRes.data.ruc ?? null,
    website_url: sellerRes.data.website_url ?? null,
    seller_type: sellerRes.data.seller_type ?? 'particular',
  };

  return <PerfilVendedorClient data={data} />;
}
