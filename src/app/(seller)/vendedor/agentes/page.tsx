export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/roles';
import { AgentesClient } from '@/components/v2/AgentesClient';
import type { AgentRow } from '@/components/v2/AgentesClient';

export default async function AgentesPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login');
  if (ctx.sellerType !== 'empresa') redirect('/vendedor');

  const supabase = await createClient();

  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id, max_agents')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  const maxAgents = seller?.max_agents ?? 3;
  const sellerId = seller?.id;

  // Obtener agent_ids vinculados a propiedades del seller
  let agents: AgentRow[] = [];

  if (sellerId) {
    const { data: props } = await supabase
      .from('properties')
      .select('agent_id')
      .eq('seller_id', sellerId)
      .not('agent_id', 'is', null);

    const agentIds = [...new Set((props ?? []).map((p) => p.agent_id).filter(Boolean))] as string[];

    if (agentIds.length > 0) {
      const { data: agentRows } = await supabase
        .from('agents')
        .select('id, name, email, phone, title, whatsapp, photo')
        .in('id', agentIds);

      // Contar propiedades por agente
      const counts: Record<string, number> = {};
      for (const p of (props ?? [])) {
        if (p.agent_id) counts[p.agent_id] = (counts[p.agent_id] ?? 0) + 1;
      }

      agents = (agentRows ?? []).map((a) => ({
        ...a,
        properties_count: counts[a.id] ?? 0,
      }));
    }
  }

  return <AgentesClient agents={agents} maxAgents={maxAgents} />;
}
