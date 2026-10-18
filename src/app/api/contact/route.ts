import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Contrato: POST { listingId, name, email, phone?, message } → { ok: true } | { error }
const ContactSchema = z.object({
  listingId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().min(5).max(3000),
});

type ContactInput = z.infer<typeof ContactSchema>;

// Rate limit best-effort en memoria (por instancia): 5 envíos / 10 min por IP
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calculateLeadScore(data: ContactInput) {
  let score = 10; // email siempre presente
  const details: string[] = ['Email proporcionado'];
  if (data.phone) {
    score += 20;
    details.push('Teléfono proporcionado');
  }
  if (data.message.length > 50) {
    score += 30;
    details.push('Mensaje detallado');
  }
  const urgencyKeywords = ['urgente', 'visita', 'comprar', 'alquilar', 'interesado'];
  const lower = data.message.toLowerCase();
  if (urgencyKeywords.some((kw) => lower.includes(kw))) {
    score += 20;
    details.push('Palabras clave de urgencia');
  }
  return { score, details };
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientIp(req))) {
    return NextResponse.json({ error: 'Demasiadas consultas. Intentá de nuevo en unos minutos.' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.issues.map((i) => i.path.join('.')) }, { status: 400 });
  }
  const input = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error('[contact] admin client no disponible:', e);
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 500 });
  }

  // Usuario logueado (opcional) → buyer_id
  let buyerId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    buyerId = user?.id ?? null;
  } catch {
    buyerId = null;
  }

  // listing → seller_profile → email del vendedor
  const { data: listing, error: listingErr } = await admin
    .from('listings')
    .select('id, title, status, seller_profile_id')
    .eq('id', input.listingId)
    .maybeSingle();

  if (listingErr || !listing || listing.status !== 'active') {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
  }

  let sellerUserId: string | null = null;
  let sellerEmail: string | null = null;
  let sellerName: string | null = null;
  if (listing.seller_profile_id) {
    const { data: sp } = await admin
      .from('seller_profiles')
      .select('id, user_id, full_name, company_name')
      .eq('id', listing.seller_profile_id)
      .maybeSingle();
    if (sp?.user_id) {
      sellerUserId = sp.user_id as string;
      sellerName = (sp.company_name as string | null) ?? (sp.full_name as string | null);
      const { data: prof } = await admin
        .from('profiles')
        .select('email')
        .eq('id', sp.user_id)
        .maybeSingle();
      sellerEmail = (prof?.email as string | undefined) ?? null;
    }
  }

  const { score, details } = calculateLeadScore(input);

  // seller_id = auth uid del vendedor (seller_profiles.user_id): coincide con el filtro
  // de src/lib/seller/fetch-dashboard.ts (.eq('seller_id', user.id)).
  // property_id = listings.id (la policy leads_read_seller_and_admin hace listings.id = leads.property_id).
  const baseLead = {
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    message: input.message,
    property_id: listing.id,
  };
  const fullLead = {
    ...baseLead,
    seller_id: sellerUserId,
    buyer_id: buyerId,
    score,
    score_details: details,
  };

  let { error: insertErr } = await admin.from('leads').insert(fullLead);
  // Fallback si la migración de columnas extra (seller_id/buyer_id/score) aún no está aplicada
  if (insertErr && (insertErr.code === '42703' || insertErr.code === 'PGRST204')) {
    console.warn('[contact] columnas de leads faltantes, insertando sin extras:', insertErr.message);
    ({ error: insertErr } = await admin.from('leads').insert(baseLead));
  }
  if (insertErr) {
    console.error('[contact] error insertando lead:', insertErr);
    return NextResponse.json({ error: 'No se pudo registrar la consulta' }, { status: 500 });
  }

  // Notificación por email (best-effort, no bloquea el ok)
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && sellerEmail) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM_EMAIL ?? 'InmobiliariaPY <no-reply@inmobiliariapy.com>';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://inmobiliariapy.com';
      const title = escapeHtml(String(listing.title ?? 'tu propiedad'));

      const { error: mailErr } = await resend.emails.send({
        from,
        to: [sellerEmail],
        replyTo: input.email,
        subject: `Nueva consulta: ${String(listing.title ?? 'propiedad').slice(0, 120)}`,
        html: `
          <h2>Nueva consulta sobre ${title}</h2>
          <p>Hola ${escapeHtml(sellerName ?? '')},</p>
          <p>Recibiste una nueva consulta desde InmobiliariaPY.</p>
          <ul>
            <li><strong>Nombre:</strong> ${escapeHtml(input.name)}</li>
            <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
            ${input.phone ? `<li><strong>Teléfono:</strong> ${escapeHtml(input.phone)}</li>` : ''}
          </ul>
          <p><strong>Mensaje:</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
          <hr />
          <p>Respondé este email para contestarle directamente, o gestioná tus leads en
          <a href="${appUrl}/vendedor">${appUrl}/vendedor</a>.</p>
        `,
      });
      if (mailErr) console.error('[contact] Resend error (vendedor):', mailErr);

      // Confirmación breve al comprador (sin repetir su mensaje)
      await resend.emails
        .send({
          from,
          to: [input.email],
          subject: 'Recibimos tu consulta',
          html: `<p>Hola ${escapeHtml(input.name)},</p><p>Tu consulta sobre <strong>${title}</strong> fue enviada al anunciante. Te contactará a la brevedad.</p><p>— InmobiliariaPY</p>`,
        })
        .catch((e: unknown) => console.error('[contact] Resend error (comprador):', e));
    } catch (e) {
      console.error('[contact] fallo enviando email:', e);
    }
  } else if (!apiKey) {
    console.warn('[contact] RESEND_API_KEY no configurada: lead guardado sin notificación');
  }

  return NextResponse.json({ ok: true });
}
