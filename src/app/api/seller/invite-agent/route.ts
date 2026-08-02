import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';



const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://inmobiliariapy.com';
const resend = new Resend(process.env.RESEND_API_KEY);

function buildInviteEmailHtml(
  agentName: string,
  sellerName: string,
  companyName: string,
  inviteToken: string
): string {
  const inviteUrl = `${SITE_URL}/auth/invite?token=${inviteToken}`;

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
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);">🎉 Invitación para unirte al equipo</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 6px;font-size:16px;color:#1a2e4a;font-weight:600;">Hola ${agentName} 👋</p>
            <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
              <strong>${sellerName}</strong> te ha invitado a unirte al equipo de <strong>${companyName}</strong> en InmobiliariaPY.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
              Como agente, podrás gestionar propiedades, recibir leads y acceder a herramientas exclusivas para potenciar tu carrera inmobiliaria.
            </p>
            <div style="text-align:center;margin-top:24px;">
              <a href="${inviteUrl}"
                style="display:inline-block;background:#B8922A;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;">
                Aceptar invitación →
              </a>
            </div>
            <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;">
              Este enlace expira en 7 días. Si no solicitaste esta invitación, puedes ignorar este email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:11px;color:#aaa;">
              InmobiliariaPY · El mercado inmobiliario premium de Paraguay.<br>
              <a href="${SITE_URL}" style="color:#B8922A;">${SITE_URL}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { agentId, agentEmail, agentName } = body;

    if (!agentId || !agentEmail || !agentName) {
      return NextResponse.json({ error: 'agentId, agentEmail y agentName son obligatorios' }, { status: 400 });
    }

    // Get seller profile info
    const { data: seller } = await supabase
      .from('seller_profiles')
      .select('id, company_name, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!seller) {
      return NextResponse.json({ error: 'Perfil de vendedor no encontrado' }, { status: 404 });
    }

    // Get seller's user metadata for name
    const sellerName = user.user_metadata?.full_name || seller.company_name || 'Administrador';

    // Generate invite token (simple UUID-based token)
    const inviteToken = crypto.randomUUID();

    // Store invite in database (you may need to create an agent_invites table)
    // For now, we'll use the agents table with an invite_token field
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        invite_token: inviteToken,
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        invited_by: seller.id,
      })
      .eq('id', agentId);

    if (updateError) {
      console.error('Error updating agent with invite token:', updateError);
      return NextResponse.json({ error: 'Error al generar invitación' }, { status: 500 });
    }

    // Send invitation email
    const { error: emailError } = await resend.emails.send({
      from: `InmobiliariaPY <invitaciones@inmobiliariapy.com>`,
      to: [agentEmail],
      subject: `🎉 Invitación para unirte a ${seller.company_name}`,
      html: buildInviteEmailHtml(agentName, sellerName, seller.company_name, inviteToken),
    });

    if (emailError) {
      console.error('Error sending invite email:', emailError);
      return NextResponse.json({ error: 'Error al enviar email de invitación' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitación enviada exitosamente',
      inviteToken 
    });

  } catch (error: any) {
    console.error('Invite agent error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
