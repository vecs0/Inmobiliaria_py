import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOpenAI } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';
import { clientIp, rateLimit } from '../rate-limit';

const bodySchema = z.object({
  query: z.string().trim().min(3, 'Query demasiado corta').max(300),
  limit: z.coerce.number().int().min(1).max(20).default(6),
  threshold: z.coerce.number().default(0.5),
});

export async function POST(req: Request) {
  try {
    if (!rateLimit(`semantic:${clientIp(req)}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Solicitud inválida' }, { status: 400 });
    }
    const { query, limit } = parsed.data;
    const threshold = Math.min(0.95, Math.max(0.5, parsed.data.threshold));

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Búsqueda semántica no disponible' }, { status: 503 });
    }

    const embeddingRes = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('match_properties', {
      query_embedding: embeddingRes.data[0].embedding,
      match_threshold: threshold,
      match_count: limit,
    });
    if (error) throw error;

    return NextResponse.json({ results: data ?? [], query });
  } catch (err) {
    console.error('Semantic search error:', err);
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 });
  }
}
