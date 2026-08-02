import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'edge';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://inmobiliariapy.com';

const resend = new Resend(process.env.RESEND_API_KEY);

function buildQuery(supabase: any, filters: Record<string, any>) {
  let q = supabase
    .from('properties')
    .select('id, title, price, location, type, beds, area, image_url, created_at')
    .eq('status', 'active')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  if (filters.ciudad) q = q.ilike('location', `%${filters.ciudad}%`);
  if (filters.tipo)   q = q.eq('type', filters.tipo);
  if (filters.precioMax && filters.precioMax < 2000000) q = q.lte('price', filters.precioMax);
  if (filters.precioMin && filters.precioMin > 0) q = q.gte('price', filters.precioMin);
  if (filters.bedrooms && filters.bedrooms > 0) q = q.gte('beds', filters.bedrooms);

  return q;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function buildEmailHtml(
  userName: string,
  searchName: string,
  properties: any[]
): string {
  const cards = properties.map((p) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        <a href="${SITE_URL}/propiedades/${p.id}" style="text-decoration:none;color:inherit;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="80" valign="top">
                <img src="${p.image_url || `${SITE_URL}/placeholder.jpg`}"
                  width="72" height="72"
                  style="border-radius:8px;object-fit:cover;display:block;"
                  alt="${p.title}" />
              </td>
              <td style="padding-left:12px;" valign="top">
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a2e4a;line-height:1.3;">${p.title}</p>
                <p style="margin:0 0 4px;font-size:12px;color:#666;">${p.location} · ${p.type}</p>
                <p style="margin:0;font-size:15px;font-weight:700;color:#B8922A;">${formatPrice(p.price)}</p>
              </td>
            </tr>
          </table>
        </a>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1a2e4a;padding:28px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">InmobiliariaPY</p>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);">🔔 Nueva alerta: ${searchName}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 6px;font-size:16px;color:#1a2e4a;font-weight:600;">Hola${userName ? ` ${userName}` : ''} 👋</p>
            <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
              Encontramos <strong>${properties.length} propiedad${properties.length !== 1 ? 'es' : ''} nueva${properties.length !== 1 ? 's' : ''}</strong>
              que coincide${properties.length === 1 ? '' : 'n'} con tu búsqueda guardada <strong>"${searchName}"</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${cards}
            </table>
            <div style="text-align:center;margin-top:24px;">
              <a href="${SITE_URL}/propiedades"
                style="display:inline-block;background:#B8922A;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;">
                Ver todas las propiedades →
              </a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:11px;color:#aaa;">
              Recibiste este email porque guardaste una alerta en InmobiliariaPY.<br>
              <a href="${SITE_URL}/propiedades" style="color:#B8922A;">Gestionar mis alertas</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(req: Request) {
  try {
    // Security check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Fetch all active saved searches
    const { data: savedSearches, error: ssErr } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('active', true);

    if (ssErr) throw ssErr;
    if (!savedSearches || savedSearches.length === 0) {
      return NextResponse.json({ ok: true, message: 'No active saved searches', processed: 0 });
    }

    let notified = 0;
    let skipped = 0;

    for (const search of savedSearches) {
      try {
        // 2. Find matching new properties
        const { data: matches } = await buildQuery(supabase, search.filters);
        if (!matches || matches.length === 0) { skipped++; continue; }

        // 3. Get user email from auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(search.user_id);
        const email = authUser?.user?.email;
        const userName = authUser?.user?.user_metadata?.full_name ?? '';
        if (!email) { skipped++; continue; }

        let emailSuccess = true;
        // 4. Send email via Resend
        const { error: emailErr } = await resend.emails.send({
          from: `InmobiliariaPY <alertas@inmobiliariapy.com>`,
          to: [email],
          subject: `🔔 ${matches.length} nueva${matches.length !== 1 ? 's' : ''} propiedad${matches.length !== 1 ? 'es' : ''} para "${search.name}"`,
          html: buildEmailHtml(userName, search.name, matches),
        });

        if (emailErr) {
          console.error(`Email error for ${email}:`, emailErr);
          emailSuccess = false;
        }

        let pushSuccess = true;
        // 5. Send push notification if user has subscription
        try {
          const pushRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: search.user_id,
              title: `${matches.length} nueva${matches.length !== 1 ? 's' : ''} propiedad${matches.length !== 1 ? 'es' : ''} para "${search.name}"`,
              body: matches[0]?.title || 'Nueva propiedad disponible',
              url: `${SITE_URL}/propiedades`,
            }),
          });
          if (!pushRes.ok) pushSuccess = false;
        } catch (pushErr) {
          console.error(`Push notification error for ${email}:`, pushErr);
          pushSuccess = false;
        }

        if (!emailSuccess && !pushSuccess) {
          skipped++;
          continue;
        }

        // 6. Update last_notified_at
        await supabase
          .from('saved_searches')
          .update({ last_notified_at: new Date().toISOString() })
          .eq('id', search.id);

        notified++;
      } catch (innerErr) {
        console.error(`Error processing search ${search.id}:`, innerErr);
        skipped++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: savedSearches.length,
      notified,
      skipped,
    });
  } catch (err: any) {
    console.error('Cron notify-alerts error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
