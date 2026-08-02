import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function buildPropertyText(prop: any): string {
  const parts = [
    prop.title,
    prop.type,
    prop.location,
    prop.city,
    prop.description,
    prop.bedrooms > 0 ? `${prop.bedrooms} habitaciones` : '',
    prop.bathrooms > 0 ? `${prop.bathrooms} baños` : '',
    prop.sqm > 0 ? `${prop.sqm} metros cuadrados` : '',
    `precio ${prop.price} dólares`,
    prop.price_type === 'alquiler' ? 'en alquiler' : 'en venta',
    ...(prop.amenities ?? []),
  ].filter(Boolean);
  return parts.join('. ');
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { propertyId } = await req.json();
    if (!propertyId) return NextResponse.json({ error: 'Falta propertyId' }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 503 });
    }

    const { data: prop, error: propErr } = await getSupabaseAdmin()
      .from('properties')
      .select('id, title, type, location, city, description, bedrooms, bathrooms, sqm, price, price_type, amenities')
      .eq('id', propertyId)
      .single();

    if (propErr || !prop) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    const text = buildPropertyText(prop);
    const embeddingRes = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    const embedding = embeddingRes.data[0].embedding;

    const { error: updateErr } = await getSupabaseAdmin()
      .from('properties')
      .update({ embedding })
      .eq('id', propertyId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, propertyId, textLength: text.length });
  } catch (err: any) {
    console.error('Index property error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: indexar todas las propiedades sin embedding (batch, máx 50)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { data: props } = await getSupabaseAdmin()
      .from('properties')
      .select('id, title, type, location, city, description, bedrooms, bathrooms, sqm, price, price_type, amenities')
      .eq('status', 'active')
      .is('embedding', null)
      .limit(50);

    if (!props || props.length === 0) {
      return NextResponse.json({ ok: true, indexed: 0, message: 'Todas las propiedades ya están indexadas' });
    }

    let indexed = 0;
    let failed = 0;

    for (const prop of props) {
      try {
        const text = buildPropertyText(prop);
        const embeddingRes = await getOpenAI().embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        });
        await getSupabaseAdmin()
          .from('properties')
          .update({ embedding: embeddingRes.data[0].embedding })
          .eq('id', prop.id);
        indexed++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({ ok: true, indexed, failed, remaining: props.length - indexed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
