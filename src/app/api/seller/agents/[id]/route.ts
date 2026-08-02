import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Verificar que el agente está vinculado a propiedades de este seller
  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id, seller_type')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller || seller.seller_type !== 'empresa') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  // Desvincular agente de propiedades (no eliminar el agente del catálogo)
  await supabase
    .from('properties')
    .update({ agent_id: null })
    .eq('seller_id', seller.id)
    .eq('agent_id', params.id);

  await supabase
    .from('listings')
    .update({ agent_id: null })
    .eq('seller_profile_id', seller.id)
    .eq('agent_id', params.id);

  return NextResponse.json({ success: true });
}
