import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id, seller_type')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller || seller.seller_type !== 'empresa') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  // Desvincular agente de los listings del seller (no se elimina el agente del catálogo)
  const { error } = await supabase
    .from('listings')
    .update({ agent_id: null })
    .eq('seller_profile_id', seller.id)
    .eq('agent_id', id);

  if (error) {
    console.error('[agents/:id] unlink error:', error);
    return NextResponse.json({ error: 'No se pudo desvincular el agente.' }, { status: 500 });
  }

  // Revocar invitación pendiente si el agente fue invitado por este seller
  await supabase
    .from('agents')
    .update({ invite_token: null, invite_expires_at: null, invited_by: null })
    .eq('id', id)
    .eq('invited_by', seller.id);

  return NextResponse.json({ success: true });
}
