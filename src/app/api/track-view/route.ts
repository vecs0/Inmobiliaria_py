import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// POST { listingId } (o legacy { propertyId }) → { ok }
// El seller se resuelve en el servidor desde el listing (no se confía en el cliente).
// property_views.seller_id = auth uid del vendedor (policy pv_select_own: auth.uid() = seller_id).

const BodySchema = z
  .object({
    listingId: z.string().trim().min(1).max(100).optional(),
    propertyId: z.string().trim().min(1).max(100).optional(),
  })
  .refine((b) => b.listingId || b.propertyId);

const HOUR_MS = 60 * 60 * 1000;
const recent = new Map<string, number>(); // dedupe best-effort por instancia

function seenRecently(key: string): boolean {
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < HOUR_MS) return true;
  recent.set(key, now);
  if (recent.size > 10000) {
    for (const [k, t] of recent) if (now - t >= HOUR_MS) recent.delete(k);
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
    const listingId = (parsed.data.listingId ?? parsed.data.propertyId) as string;

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? 'unknown';
    const ipHash = createHash('sha256').update(ip + listingId).digest('hex').slice(0, 16);

    if (seenRecently(ipHash)) return NextResponse.json({ ok: true, deduped: true });

    let db: SupabaseClient;
    try {
      db = createAdminClient();
    } catch {
      db = await createClient();
    }

    const { data: listing } = await db
      .from('listings')
      .select('id, seller_profile_id')
      .eq('id', listingId)
      .maybeSingle();
    if (!listing) return NextResponse.json({ ok: false }, { status: 404 });

    let sellerUserId: string | null = null;
    if (listing.seller_profile_id) {
      const { data: sp } = await db
        .from('seller_profiles')
        .select('user_id')
        .eq('id', listing.seller_profile_id)
        .maybeSingle();
      sellerUserId = (sp?.user_id as string | null) ?? null;
    }

    // Dedupe persistente (entre instancias) — best-effort
    const since = new Date(Date.now() - HOUR_MS).toISOString();
    const { data: dup } = await db
      .from('property_views')
      .select('id')
      .eq('property_id', listing.id)
      .eq('ip_hash', ipHash)
      .gte('created_at', since)
      .limit(1);
    if (dup && dup.length > 0) return NextResponse.json({ ok: true, deduped: true });

    const { error } = await db.from('property_views').insert({
      property_id: listing.id,
      seller_id: sellerUserId,
      ip_hash: ipHash,
      user_agent: req.headers.get('user-agent')?.slice(0, 200) ?? null,
    });
    if (error) {
      console.error('[track-view] insert error:', error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
