import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCronSecret } from '../_lib/auth';

export const dynamic = 'force-dynamic';

/** Resetea api_keys.requests_today (RPC reset_api_key_daily_counters). */
export async function GET(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  const { error } = await createAdminClient().rpc('reset_api_key_daily_counters');
  if (error) {
    console.error('[cron/reset-api-keys]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ran_at: new Date().toISOString() });
}

export const POST = GET;
