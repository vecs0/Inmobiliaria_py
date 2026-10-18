import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendAgentInvite } from './invite';

// POST { agentId } → reenvía la invitación a un agente propio (agents.invited_by = seller_profile.id).
// El email y nombre del destinatario se toman de la DB, no del cliente.
const BodySchema = z.object({ agentId: z.string().trim().min(1).max(100) });

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'agentId es obligatorio' }, { status: 400 });

    const { data: seller } = await supabase
      .from('seller_profiles')
      .select('id, company_name, full_name, seller_type')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!seller || seller.seller_type !== 'empresa') {
      return NextResponse.json({ error: 'Solo cuentas empresa pueden invitar agentes' }, { status: 403 });
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id, email, name, invited_by')
      .eq('id', parsed.data.agentId)
      .maybeSingle();
    if (!agent || agent.invited_by !== seller.id) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    }

    const sellerName =
      (user.user_metadata?.full_name as string | undefined) || seller.full_name || seller.company_name || 'Administrador';

    const result = await sendAgentInvite(
      supabase,
      { id: seller.id, company_name: seller.company_name, full_name: seller.full_name },
      { id: agent.id, email: agent.email, name: agent.name },
      sellerName
    );
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });

    return NextResponse.json({ success: true, message: 'Invitación enviada exitosamente' });
  } catch (error: unknown) {
    console.error('Invite agent error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
