import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendAgentInvite } from '../invite-agent/invite';

const AGENT_COLUMNS = 'id, name, email, phone, title, whatsapp, photo, created_at, invite_expires_at, invited_by';

async function getSeller(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // select('*') para no fallar si max_agents no existe en seller_profiles
  const { data } = await supabase.from('seller_profiles').select('*').eq('user_id', userId).maybeSingle();
  return data as
    | { id: string; seller_type: string; company_name: string | null; full_name: string | null; max_agents?: number | null }
    | null;
}

async function getSellerAgentIds(supabase: Awaited<ReturnType<typeof createClient>>, sellerId: string): Promise<string[]> {
  const [invitedRes, listingsRes] = await Promise.all([
    supabase.from('agents').select('id').eq('invited_by', sellerId),
    supabase.from('listings').select('agent_id').eq('seller_profile_id', sellerId).not('agent_id', 'is', null),
  ]);
  const ids = new Set<string>();
  for (const a of (invitedRes.data ?? []) as { id: string }[]) ids.add(a.id);
  for (const l of (listingsRes.data ?? []) as { agent_id: string | null }[]) if (l.agent_id) ids.add(l.agent_id);
  return [...ids];
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const seller = await getSeller(supabase, user.id);
  if (!seller) return NextResponse.json({ agents: [] });

  const agentIds = await getSellerAgentIds(supabase, seller.id);
  if (agentIds.length === 0) return NextResponse.json({ agents: [] });

  const { data: agents } = await supabase.from('agents').select(AGENT_COLUMNS).in('id', agentIds);
  return NextResponse.json({ agents: agents ?? [] });
}

const AgentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional(),
  title: z.string().trim().max(80).optional(),
  whatsapp: z.string().trim().max(40).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const parsed = AgentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nombre y email válidos son obligatorios.' }, { status: 400 });
  }
  const { name, email, phone, title, whatsapp } = parsed.data;

  const seller = await getSeller(supabase, user.id);
  if (!seller || seller.seller_type !== 'empresa') {
    return NextResponse.json({ error: 'Solo cuentas empresa pueden gestionar agentes.' }, { status: 403 });
  }

  const existingIds = await getSellerAgentIds(supabase, seller.id);
  const maxAgents = seller.max_agents ?? 3;
  if (existingIds.length >= maxAgents) {
    return NextResponse.json({ error: `Límite de ${maxAgents} agentes alcanzado.` }, { status: 400 });
  }

  const { data: agent, error } = await supabase
    .from('agents')
    .insert({
      name,
      email: email.toLowerCase(),
      phone: phone ?? '',
      title: title || 'Agente inmobiliario',
      whatsapp: whatsapp ?? '',
      photo: '',
      invited_by: seller.id,
    })
    .select(AGENT_COLUMNS)
    .single();

  if (error || !agent) {
    console.error('[agents] insert error:', error);
    return NextResponse.json({ error: 'No se pudo crear el agente.' }, { status: 500 });
  }

  // Invitación directa (sin fetch interno, que perdía las cookies de sesión)
  const sellerName =
    (user.user_metadata?.full_name as string | undefined) || seller.full_name || seller.company_name || 'Administrador';
  const invite = await sendAgentInvite(
    supabase,
    { id: seller.id, company_name: seller.company_name, full_name: seller.full_name },
    { id: agent.id as string, email: agent.email as string, name: agent.name as string },
    sellerName
  ).catch((e: unknown) => {
    console.error('[agents] invite error:', e);
    return { ok: false };
  });

  return NextResponse.json({ agent, success: true, inviteSent: invite.ok });
}
