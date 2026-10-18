import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Exige usuario logueado con seller_profiles.seller_type = 'empresa'. */
export async function requireEmpresaSeller(): Promise<
  { sellerProfileId: string } | { response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };

  const { data: sp } = await supabase
    .from('seller_profiles')
    .select('id, seller_type')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!sp || sp.seller_type !== 'empresa') {
    return { response: NextResponse.json({ error: 'Solo cuentas de empresa pueden importar' }, { status: 403 }) };
  }
  return { sellerProfileId: sp.id };
}
