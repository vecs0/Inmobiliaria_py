import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { generateListingEmbedding } from '@/lib/ai/embeddings';

export const maxDuration = 60;

const bodySchema = z.object({ listingId: z.string().uuid().optional() });

function isCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`;
}

async function indexBatch() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('listings')
    .select('id')
    .eq('status', 'active')
    .is('embedding', null)
    .limit(50);
  if (error) throw error;

  let indexed = 0;
  let failed = 0;
  for (const row of data ?? []) {
    try {
      (await generateListingEmbedding(row.id)) ? indexed++ : failed++;
    } catch (e) {
      console.error('Batch index error:', (e as Error).message);
      failed++;
    }
  }
  return { ok: true, indexed, failed, scanned: data?.length ?? 0 };
}

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'listingId inválido' }, { status: 400 });
    const { listingId } = parsed.data;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 503 });
    }

    if (isCron(req)) {
      if (!listingId) return NextResponse.json(await indexBatch());
      const ok = await generateListingEmbedding(listingId);
      return NextResponse.json({ ok, listingId });
    }

    // Usuario autenticado: solo su propio listing
    if (!listingId) return NextResponse.json({ error: 'Falta listingId' }, { status: 400 });
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = createAdminClient();
    const [{ data: listing }, { data: sp }] = await Promise.all([
      admin.from('listings').select('seller_profile_id').eq('id', listingId).maybeSingle(),
      admin.from('seller_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    ]);
    if (!listing) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    if (!sp || listing.seller_profile_id !== sp.id) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const ok = await generateListingEmbedding(listingId);
    return NextResponse.json({ ok, listingId });
  } catch (err) {
    console.error('Index property error:', err);
    return NextResponse.json({ error: 'Error indexando la propiedad' }, { status: 500 });
  }
}

// GET: batch para cron (máx 50 listings activos sin embedding)
export async function GET(req: Request) {
  if (!isCron(req)) return new Response('Unauthorized', { status: 401 });
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 503 });
  }
  try {
    return NextResponse.json(await indexBatch());
  } catch (err) {
    console.error('Index batch error:', err);
    return NextResponse.json({ error: 'Error en indexación batch' }, { status: 500 });
  }
}
