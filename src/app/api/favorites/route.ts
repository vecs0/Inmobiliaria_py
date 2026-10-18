import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Contrato:
//   GET    /api/favorites                → { ids: string[] }
//   POST   /api/favorites { listingId }  → { ok: true }
//   DELETE /api/favorites?listingId=...  → { ok: true }
// Usa el cliente de sesión (RLS: cada usuario solo ve/modifica sus favoritos).
// La columna es favorites.property_id y guarda el id del listing.

const ListingId = z.string().trim().min(1).max(100);

async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data, error } = await supabase
    .from('favorites')
    .select('property_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Error al obtener favoritos' }, { status: 500 });

  const ids = (data ?? [])
    .map((r: { property_id: string | null }) => r.property_id)
    .filter((id): id is string => Boolean(id));
  return NextResponse.json({ ids });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = z.object({ listingId: ListingId }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'listingId requerido' }, { status: 400 });
  const { listingId } = parsed.data;

  // Idempotente: si ya existe, ok
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('property_id', listingId)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true });

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, property_id: listingId });

  if (error && error.code !== '23505') {
    console.error('[favorites] insert error:', error);
    return NextResponse.json({ error: 'No se pudo guardar el favorito' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const parsed = ListingId.safeParse(req.nextUrl.searchParams.get('listingId') ?? '');
  if (!parsed.success) return NextResponse.json({ error: 'listingId requerido' }, { status: 400 });

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('property_id', parsed.data);

  if (error) {
    console.error('[favorites] delete error:', error);
    return NextResponse.json({ error: 'No se pudo quitar el favorito' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
