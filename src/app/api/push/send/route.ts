import { NextResponse } from 'next/server';
import webpush, { type PushSubscription, WebPushError } from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCronSecret } from '@/app/api/cron/_lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let vapidConfigured = false;

function configureVapid(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

function isValidSubscription(s: unknown): s is PushSubscription {
  const sub = s as PushSubscription | null;
  return !!sub && typeof sub.endpoint === 'string' && !!sub.keys?.p256dh && !!sub.keys?.auth;
}

/**
 * Endpoint INTERNO (cron / servidor). Requiere `Authorization: Bearer ${CRON_SECRET}`.
 * Body: { userId: string, title: string, body?: string, url?: string }
 */
export async function POST(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  if (!configureVapid()) {
    return NextResponse.json(
      { error: 'Push no configurado: faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o VAPID_SUBJECT' },
      { status: 503 },
    );
  }

  let payload: { userId?: unknown; title?: unknown; body?: unknown; url?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const userId = typeof payload.userId === 'string' ? payload.userId : null;
  const title = typeof payload.title === 'string' ? payload.title.slice(0, 120) : null;
  if (!userId || !title) {
    return NextResponse.json({ error: 'userId and title are required' }, { status: 400 });
  }
  const body = typeof payload.body === 'string' ? payload.body.slice(0, 300) : '';
  // Solo rutas relativas para evitar redirecciones a dominios externos desde la notificación
  const url = typeof payload.url === 'string' && payload.url.startsWith('/') ? payload.url : '/';

  const db = createAdminClient();
  const { data: rows, error } = await db
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'No push subscription found for user' }, { status: 404 });
  }

  const message = JSON.stringify({ title, body, url, icon: '/icon-192.png' });
  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const row of rows as { id: string; subscription: unknown }[]) {
    if (!isValidSubscription(row.subscription)) {
      await db.from('push_subscriptions').delete().eq('id', row.id);
      removed++;
      continue;
    }
    try {
      await webpush.sendNotification(row.subscription, message, { TTL: 60 * 60 * 24 });
      sent++;
    } catch (err) {
      const status = err instanceof WebPushError ? err.statusCode : 0;
      if (status === 404 || status === 410) {
        await db.from('push_subscriptions').delete().eq('id', row.id);
        removed++;
      } else {
        console.error('[push/send] error enviando:', status, err instanceof Error ? err.message : err);
        failed++;
      }
    }
  }

  return NextResponse.json({ success: sent > 0, sent, removed, failed }, { status: sent > 0 || failed === 0 ? 200 : 502 });
}
