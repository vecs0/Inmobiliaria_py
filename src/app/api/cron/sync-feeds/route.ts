import { NextResponse } from 'next/server';

/**
 * Cron Route for Feed Synchronization
 * This endpoint is designed to be called by Vercel Cron or any external scheduler.
 * It fetches all active feeds from the database and triggers the import process.
 */

export async function GET(req: Request) {
  try {
    // 1. Security Check: Verify Cron Secret
    // Vercel sends a secret header to ensure the route is not called publicly
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Starting scheduled feed synchronization...');

    // 2. Fetch active feeds from the database
    // We assume a 'import_feeds' table exists to store the URLs and frequencies
    // If the table doesn't exist yet, we will use a fallback list or create the table.
    const { data: feeds, error: fetchError } = await fetchActiveFeeds();

    if (fetchError) throw fetchError;
    if (!feeds || feeds.length === 0) {
      return NextResponse.json({ success: true, message: 'No active feeds found to sync' });
    }

    const results = [];

    // 3. Process each feed
    for (const feed of feeds) {
      try {
        console.log(`Syncing feed: ${feed.url}`);

        // Trigger the existing XML import logic
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/import/xml`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: feed.url }),
        });

        const result = await response.json();
        results.push({ url: feed.url, status: response.ok ? 'success' : 'error', detail: result });
      } catch (err: any) {
        results.push({ url: feed.url, status: 'error', detail: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed_feeds: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Cron Sync Error:', error);
    return NextResponse.json({ error: 'Internal server error during cron sync' }, { status: 500 });
  }
}

/**
 * Helper to fetch active feeds from Supabase
 * Since the 'import_feeds' table hasn't been created yet, I will implement a
 * mock version that we can later replace with a real table.
 */
async function fetchActiveFeeds() {
  // In a real implementation, this would be:
  // const supabase = await createClient();
  // return await supabase.from('import_feeds').select('*').eq('active', true);

  // Mock data for now to demonstrate the functionality
  return {
    data: [
      { id: '1', url: 'https://example.com/feed1.xml', active: true },
      { id: '2', url: 'https://example.com/feed2.xml', active: true },
    ],
    error: null,
  };
}
