import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Obtener agentes vinculados a propiedades del seller
  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller) return NextResponse.json({ agents: [] });

  const { data: props } = await supabase
    .from('properties')
    .select('agent_id')
    .eq('seller_id', seller.id)
    .not('agent_id', 'is', null);

  const agentIds = [...new Set((props ?? []).map((p) => p.agent_id).filter(Boolean))] as string[];

  if (agentIds.length === 0) return NextResponse.json({ agents: [] });

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .in('id', agentIds);

  return NextResponse.json({ agents: agents ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, title, whatsapp } = body;

  if (!name || !email) {
    return NextResponse.json({ error: 'Nombre y email son obligatorios.' }, { status: 400 });
  }

  // Verificar límite de agentes del plan
  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id, max_agents, seller_type')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!seller || seller.seller_type !== 'empresa') {
    return NextResponse.json({ error: 'Solo cuentas empresa pueden gestionar agentes.' }, { status: 403 });
  }

  // Contar agentes actuales
  const { data: existingProps } = await supabase
    .from('properties')
    .select('agent_id')
    .eq('seller_id', seller.id)
    .not('agent_id', 'is', null);

  const existingAgentIds = new Set((existingProps ?? []).map((p) => p.agent_id));

  const maxAgents = seller.max_agents ?? 3;
  if (existingAgentIds.size >= maxAgents) {
    return NextResponse.json({ error: `Límite de ${maxAgents} agentes alcanzado.` }, { status: 400 });
  }

  // Crear agente
  const { data: agent, error } = await supabase
    .from('agents')
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ?? '',
      title: title ?? 'Agente inmobiliario',
      whatsapp: whatsapp ?? '',
      photo: '',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enviar email de invitación via Edge Function invite-agent
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/seller/invite-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: agent.id,
        agentEmail: email,
        agentName: name,
      }),
    });
  } catch (inviteErr) {
    console.error('Error sending invite email:', inviteErr);
    // No fallamos la creación del agente si falla el email
  }

  return NextResponse.json({ agent, success: true });
}
