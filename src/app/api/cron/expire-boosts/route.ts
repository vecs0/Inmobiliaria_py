import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCronSecret } from '../_lib/auth';

export const dynamic = 'force-dynamic';

/** Expira boosts vencidos y resetea listings.featured (RPC expire_property_boosts). */
export async function GET(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  const { error } = await createAdminClient().rpc('expire_property_boosts');
  if (error) {
    console.error('[cron/expire-boosts]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ran_at: new Date().toISOString() });
}

export const POST = GET;
