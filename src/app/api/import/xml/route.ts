import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireEmpresaSeller } from '@/lib/import/auth';
import { importListings, summaryToResponse, MAX_IMPORT_ITEMS } from '@/lib/import/import-listings';
import { parseCsvItems, parseXmlItems, detectFormat } from '@/lib/import/parse-feed';
import { fetchFeedText, FeedFetchError } from '@/lib/import/ssrf';
import type { ImportMappingProfile } from '@/lib/import/mapper';

export const maxDuration = 60;

/**
 * Recibe XML o CSV (xmlData / data, o url https) y lo importa directamente.
 * Responde con el resumen (imported/deduplicated/errors + results/details).
 */
export async function POST(req: Request) {
  try {
    const auth = await requireEmpresaSeller();
    if ('response' in auth) return auth.response;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    // El cliente envía profile: 'generic' (string); solo se usa si es un perfil con mappings
    const profile: ImportMappingProfile | null =
      body?.profile && typeof body.profile === 'object' && body.profile.mappings ? body.profile : null;

    let content = '';
    if (typeof body?.url === 'string' && body.url) {
      try {
        content = await fetchFeedText(body.url);
      } catch (e) {
        if (e instanceof FeedFetchError) return NextResponse.json({ error: e.message }, { status: 400 });
        throw e;
      }
    } else if (typeof body?.xmlData === 'string' || typeof body?.data === 'string') {
      content = (body.xmlData ?? body.data) as string;
      if (content.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Archivo supera 5MB' }, { status: 413 });
      }
    } else {
      return NextResponse.json({ error: 'Se requiere xmlData o url' }, { status: 400 });
    }

    const f = String(body?.format ?? '').toLowerCase();
    const format = f === 'csv' || f === 'xml' ? f : detectFormat(content);
    let items;
    try {
      items = format === 'csv' ? parseCsvItems(content, profile) : await parseXmlItems(content, profile);
    } catch {
      return NextResponse.json({ error: 'No se pudo interpretar el archivo' }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No se encontraron propiedades válidas' }, { status: 400 });
    }
    if (items.length > MAX_IMPORT_ITEMS) {
      return NextResponse.json({ error: `Máximo ${MAX_IMPORT_ITEMS} propiedades por importación` }, { status: 413 });
    }

    const summary = await importListings(createAdminClient(), auth.sellerProfileId, items);
    return NextResponse.json({ ...summaryToResponse(summary), parsed_count: items.length });
  } catch (error) {
    console.error('XML Parser Error:', error);
    return NextResponse.json({ error: 'Error procesando el feed' }, { status: 500 });
  }
}
