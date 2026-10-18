import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireEmpresaSeller } from '@/lib/import/auth';
import { importListings, summaryToResponse, MAX_IMPORT_ITEMS } from '@/lib/import/import-listings';
import { parseCsvItems, parseXmlItems, detectFormat } from '@/lib/import/parse-feed';

export const maxDuration = 60;

/**
 * Acepta:
 *  - array JSON de items
 *  - { items: [...] }
 *  - { data: "<texto crudo>", format?: 'csv' | 'xml' }  (también csvData / xmlData)
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

    let items: unknown[] | null = null;
    if (Array.isArray(body)) items = body;
    else if (Array.isArray(body?.items)) items = body.items;
    else {
      const text: unknown = body?.data ?? body?.csvData ?? body?.xmlData;
      if (typeof text === 'string' && text.trim()) {
        if (text.length > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'Archivo supera 5MB' }, { status: 413 });
        }
        const f = String(body?.format ?? '').toLowerCase();
        const format = f === 'csv' || f === 'xml' ? f : body?.csvData ? 'csv' : body?.xmlData ? 'xml' : detectFormat(text);
        try {
          items = format === 'csv' ? parseCsvItems(text) : await parseXmlItems(text);
        } catch {
          return NextResponse.json({ error: 'No se pudo interpretar el archivo' }, { status: 400 });
        }
      }
    }

    if (!items) {
      return NextResponse.json({ error: 'Se esperaba un array de propiedades o datos CSV/XML' }, { status: 400 });
    }
    if (items.length === 0) return NextResponse.json({ error: 'No hay propiedades para importar' }, { status: 400 });
    if (items.length > MAX_IMPORT_ITEMS) {
      return NextResponse.json({ error: `Máximo ${MAX_IMPORT_ITEMS} propiedades por importación` }, { status: 413 });
    }

    const summary = await importListings(createAdminClient(), auth.sellerProfileId, items);
    return NextResponse.json(summaryToResponse(summary));
  } catch (error) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: 'Error interno al procesar la importación' }, { status: 500 });
  }
}
