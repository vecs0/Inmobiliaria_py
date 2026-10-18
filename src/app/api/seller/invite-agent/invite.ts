import { createHash, randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lógica compartida de invitación de agentes (usada por /api/seller/invite-agent y POST /api/seller/agents).

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Hash del token de invitación con formato UUID (la columna agents.invite_token es UUID).
 * El flujo de aceptación debe aplicar esta misma función al token recibido por URL y comparar.
 */
export function hashInviteToken(token: string): string {
  const h = createHash('sha256').update(token).digest('hex').slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function buildInviteEmailHtml(agentName: string, sellerName: string, companyName: string, inviteUrl: string, siteUrl: string): string {
  const a = escapeHtml(agentName);
  const s = escapeHtml(sellerName);
  const c = escapeHtml(companyName);
  const u = escapeHtml(inviteUrl);
  const site = escapeHtml(siteUrl);
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a2e4a;padding:28px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">InmobiliariaPY</p>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);">Invitación para unirte al equipo</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 6px;font-size:16px;color:#1a2e4a;font-weight:600;">Hola ${a}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
              <strong>${s}</strong> te ha invitado a unirte al equipo de <strong>${c}</strong> en InmobiliariaPY.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
              Como agente, podrás gestionar propiedades, recibir leads y acceder a herramientas exclusivas.
            </p>
            <div style="text-align:center;margin-top:24px;">
              <a href="${u}" style="display:inline-block;background:#B8922A;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;">
                Aceptar invitación →
              </a>
            </div>
            <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;">
              Este enlace expira en 7 días. Si no esperabas esta invitación, ignorá este email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:11px;color:#aaa;">
              InmobiliariaPY · El mercado inmobiliario premium de Paraguay.<br>
              <a href="${site}" style="color:#B8922A;">${site}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export type InviteSeller = { id: string; company_name: string | null; full_name: string | null };

/**
 * Genera token, guarda su hash en agents.invite_token (solo si el agente pertenece al seller
 * vía agents.invited_by) y envía el email. Nunca devuelve el token.
 */
export async function sendAgentInvite(
  supabase: SupabaseClient,
  seller: InviteSeller,
  agent: { id: string; email: string; name: string },
  sellerDisplayName: string
): Promise<{ ok: boolean; error?: string; status?: number }> {
  const token = randomBytes(32).toString('base64url');
  const { data: updated, error: updateError } = await supabase
    .from('agents')
    .update({
      invite_token: hashInviteToken(token),
      invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', agent.id)
    .eq('invited_by', seller.id)
    .select('id');

  if (updateError) {
    console.error('[invite-agent] error guardando token:', updateError);
    return { ok: false, error: 'Error al generar invitación', status: 500 };
  }
  if (!updated || updated.length === 0) {
    return { ok: false, error: 'Agente no encontrado', status: 404 };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[invite-agent] RESEND_API_KEY no configurada: invitación sin email');
    return { ok: true };
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://inmobiliariapy.com';
  const inviteUrl = `${siteUrl}/auth/invite?token=${encodeURIComponent(token)}`;
  const company = seller.company_name ?? sellerDisplayName;

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'InmobiliariaPY <no-reply@inmobiliariapy.com>',
    to: [agent.email],
    subject: `Invitación para unirte a ${company}`.slice(0, 150),
    html: buildInviteEmailHtml(agent.name, sellerDisplayName, company, inviteUrl, siteUrl),
  });

  if (emailError) {
    console.error('[invite-agent] error enviando email:', emailError);
    return { ok: false, error: 'Error al enviar email de invitación', status: 502 };
  }
  return { ok: true };
}
