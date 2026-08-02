import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { query, limit = 6, threshold = 0.25 } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return NextResponse.json({ error: 'Query demasiado corta' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 503 });
    }

    // Generar embedding del query
    const embeddingRes = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: query.trim(),
    });
    const embedding = embeddingRes.data[0].embedding;

    // Buscar en Supabase via RPC match_properties
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('match_properties', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) throw error;

    return NextResponse.json({ results: data ?? [], query });
  } catch (err: any) {
    console.error('Semantic search error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
