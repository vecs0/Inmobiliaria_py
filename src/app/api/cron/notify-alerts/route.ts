import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

interface AlertMatch {
  id: string;
  title: string | null;
  price: number | null;
  currency: string | null;
  location: string | null;
  type: string | null;
  image: string | null;
}

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Quita comodines/separadores de PostgREST de un valor usado en ilike
const cleanLike = (v: unknown) => String(v ?? '').replace(/[%_,()*\\]/g, ' ').trim().slice(0, 80);

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://inmobiliariapy.com').replace(/\/$/, '');
}

function formatPrice(n: number | null, currency: string | null) {
  if (n == null) return '';
  const cur = currency === 'PYG' ? 'PYG' : 'USD';
  return new Intl.NumberFormat('es-PY', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

function buildEmailHtml(userName: string, searchName: string, properties: AlertMatch[]): string {
  const base = appUrl();
  const plural = properties.length !== 1;
  const cards = properties
    .map((p) => {
      const img = p.image
        ? `<td width="80" valign="top"><img src="${esc(p.image)}" width="72" height="72" style="border-radius:8px;object-fit:cover;display:block;" alt="${esc(p.title)}" /></td>`
        : '';
      return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        <a href="${base}/propiedades/${encodeURIComponent(p.id)}" style="text-decoration:none;color:inherit;">
          <table cellpadding="0" cellspacing="0" width="100%"><tr>
            ${img}
            <td style="padding-left:${p.image ? 12 : 0}px;" valign="top">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a2e4a;line-height:1.3;">${esc(p.title)}</p>
              <p style="margin:0 0 4px;font-size:12px;color:#666;">${esc(p.location)} · ${esc(p.type)}</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:#B8922A;">${esc(formatPrice(p.price, p.currency))}</p>
            </td>
          </tr></table>
        </a>
      </td>
    </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#1a2e4a;padding:28px 32px;text-align:center;">
          <p style="margin:0 0 6px;font-size:22px;font-weight:bold;color:#ffffff;">InmobiliariaPY</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);">Nueva alerta: ${esc(searchName)}</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 6px;font-size:16px;color:#1a2e4a;font-weight:600;">Hola${userName ? ` ${esc(userName)}` : ''}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
            Encontramos <strong>${properties.length} propiedad${plural ? 'es' : ''} nueva${plural ? 's' : ''}</strong>
            que coincide${plural ? 'n' : ''} con tu búsqueda guardada <strong>"${esc(searchName)}"</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">${cards}</table>
          <div style="text-align:center;margin-top:24px;">
            <a href="${base}/propiedades" style="display:inline-block;background:#B8922A;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;">Ver todas las propiedades</a>
          </div>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;font-size:11px;color:#aaa;">Recibiste este email porque guardaste una alerta en InmobiliariaPY.<br>
          <a href="${base}/comprador/alertas" style="color:#B8922A;">Gestionar mis alertas</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });
  }

  try {
    const supabase = createAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL ?? 'InmobiliariaPY <no-reply@inmobiliariapy.com>';
    const runStart = new Date();
    const dayAgo = new Date(runStart.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: savedSearches, error: ssErr } = await supabase
      .from('saved_searches')
      .select('id, user_id, name, filters, last_notified_at')
      .eq('active', true);
    if (ssErr) throw ssErr;
    if (!savedSearches || savedSearches.length === 0) {
      return NextResponse.json({ ok: true, message: 'No active saved searches', total: 0, notified: 0, skipped: 0 });
    }

    let notified = 0;
    let skipped = 0;

    for (const search of savedSearches) {
      try {
        const filters = (search.filters ?? {}) as Record<string, any>;
        const since = search.last_notified_at ?? dayAgo;

        let q = supabase
          .from('properties_full')
          .select('id, title, price, currency, location, type, image')
          .eq('status', 'active')
          .gt('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5);

        const ciudad = cleanLike(filters.ciudad);
        if (ciudad) q = q.ilike('city', `%${ciudad}%`);
        if (typeof filters.tipo === 'string' && filters.tipo) q = q.eq('type', filters.tipo);
        const pMax = Number(filters.precioMax);
        const pMin = Number(filters.precioMin);
        const beds = Number(filters.bedrooms);
        if (pMax > 0 && pMax < 2000000) q = q.lte('price', pMax);
        if (pMin > 0) q = q.gte('price', pMin);
        if (beds > 0) q = q.gte('bedrooms', beds);

        const { data: matches, error: mErr } = await q;
        if (mErr) throw mErr;
        if (!matches || matches.length === 0) { skipped++; continue; }

        const { data: authUser } = await supabase.auth.admin.getUserById(search.user_id);
        const email = authUser?.user?.email;
        const userName = (authUser?.user?.user_metadata?.full_name as string | undefined) ?? '';
        if (!email) { skipped++; continue; }

        const n = matches.length;
        const { error: emailErr } = await resend.emails.send({
          from,
          to: [email],
          subject: `${n} nueva${n !== 1 ? 's' : ''} propiedad${n !== 1 ? 'es' : ''} para "${search.name}"`,
          html: buildEmailHtml(userName, search.name, matches as AlertMatch[]),
        });
        if (emailErr) {
          console.error(`Email error for search ${search.id}:`, emailErr);
          skipped++;
          continue;
        }

        // Push: best-effort, no afecta el resultado
        try {
          await fetch(`${appUrl()}/api/push/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
            body: JSON.stringify({
              userId: search.user_id,
              title: `${n} nueva${n !== 1 ? 's' : ''} propiedad${n !== 1 ? 'es' : ''} para "${search.name}"`,
              body: matches[0]?.title || 'Nueva propiedad disponible',
              url: `${appUrl()}/propiedades`,
            }),
          });
        } catch (pushErr) {
          console.error(`Push error for search ${search.id}:`, pushErr);
        }

        await supabase
          .from('saved_searches')
          .update({ last_notified_at: runStart.toISOString() })
          .eq('id', search.id);
        notified++;
      } catch (innerErr) {
        console.error(`Error processing search ${search.id}:`, innerErr);
        skipped++;
      }
    }

    return NextResponse.json({ ok: true, total: savedSearches.length, notified, skipped });
  } catch (err) {
    console.error('Cron notify-alerts error:', err);
    return NextResponse.json({ ok: false, error: 'Error procesando alertas' }, { status: 500 });
  }
}
