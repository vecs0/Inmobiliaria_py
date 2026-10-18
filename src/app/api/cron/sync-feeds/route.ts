import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { importListings, MAX_IMPORT_ITEMS } from '@/lib/import/import-listings';
import { parseCsvItems, parseXmlItems, detectFormat } from '@/lib/import/parse-feed';
import { fetchFeedText } from '@/lib/import/ssrf';

export const maxDuration = 300;

interface FeedRow {
  id: string;
  seller_profile_id: string;
  url: string;
  format: string | null;
  active: boolean;
  last_synced_at: string | null;
}

/**
 * Cron de sincronización de feeds. Lee import_feeds (activos) y ejecuta la importación
 * con guarda SSRF. Protegido con CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    // import_feeds puede no estar en database.types.ts: cliente sin tipos
    const { data, error } = await supabase
      .from('import_feeds')
      .select('id, seller_profile_id, url, format, active, last_synced_at')
      .eq('active', true)
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(50);
    if (error) throw error;

    const feeds = (data ?? []) as FeedRow[];
    if (feeds.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay feeds activos', processed_feeds: [] });
    }

    const results: Record<string, unknown>[] = [];
    for (const feed of feeds) {
      try {
        const text = await fetchFeedText(feed.url);
        const fmt = (feed.format ?? '').toLowerCase();
        const format = fmt === 'csv' || fmt === 'xml' ? fmt : detectFormat(text);
        const items = (format === 'csv' ? parseCsvItems(text) : await parseXmlItems(text)).slice(0, MAX_IMPORT_ITEMS);

        const summary = await importListings(supabase, feed.seller_profile_id, items);
        await supabase.from('import_feeds').update({ last_synced_at: new Date().toISOString() }).eq('id', feed.id);
        results.push({
          feed_id: feed.id,
          status: 'success',
          created: summary.created,
          updated: summary.updated,
          skipped: summary.skipped,
          errors: summary.errors.length,
        });
      } catch (err) {
        console.error(`Feed ${feed.id} sync error:`, (err as Error).message);
        results.push({ feed_id: feed.id, status: 'error', detail: (err as Error).message });
      }
    }

    return NextResponse.json({ success: true, processed_feeds: results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Cron Sync Error:', error);
    return NextResponse.json({ error: 'Error interno en la sincronización' }, { status: 500 });
  }
}
