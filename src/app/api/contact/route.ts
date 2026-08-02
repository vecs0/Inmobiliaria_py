import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleCors, addCorsHeaders } from "@/lib/cors";
import { ContactForm } from "@/lib/supabase/types";

// We use process.env.RESEND_API_KEY which must be in .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

function calculateLeadScore(data: ContactForm) {
  let score = 0;
  const details: string[] = [];

  if (data.phone) {
    score += 20;
    details.push("Teléfono proporcionado");
  }
  if (data.email) {
    score += 10;
    details.push("Email proporcionado");
  }
  if (data.message && data.message.length > 50) {
    score += 30;
    details.push("Mensaje detallado");
  }

  const urgencyKeywords = ['urgente', 'visita', 'comprar', 'alquilar', 'interesado'];
  if (data.message && urgencyKeywords.some(kw => data.message.toLowerCase().includes(kw))) {
    score += 20;
    details.push("Palabras clave de urgencia");
  }

  return { score, details };
}

export async function OPTIONS(req: NextRequest) {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const corsPreflight = handleCors(req);
  if (corsPreflight) return corsPreflight;

  try {
    const body = await req.json();
    const { name, email, phone, message, propertyTitle, propertyId } = body as ContactForm & { propertyTitle: string, propertyId: string };

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY no configurada");
    }

    let emailData = null;
    try {
      if (process.env.RESEND_API_KEY) {
        const { data, error } = await resend.emails.send({
          from: "Inmobiliaria PY <contacto@inmobiliariapyv2.com>",
          to: email, // Enviar el correo al usuario confirmando la recepción
          subject: `Gracias por contactarnos - ${propertyTitle}`,
          html: `
            <h2>Gracias por tu interés</h2>
            <p>Hola ${name},</p>
            <p>Recibimos tu consulta sobre ${propertyTitle}.</p>
            <p>Un agente se pondrá en contacto contigo en las próximas 24 horas.</p>
            <hr />
            <p><strong>Tus datos:</strong></p>
            <p>Teléfono: ${phone}</p>
            <p>Mensaje: ${message}</p>
          `,
        });
        if (error) {
          console.error("Error enviando email con Resend:", error);
        } else {
          emailData = data;
        }
      }
    } catch (e) {
      console.error("Fallo crítico en Resend:", e);
    }

    // Calcular score del lead
    const { score, details } = calculateLeadScore(body);

    // Guardar en Supabase leads table con scoring
    const supabase = await createClient();
    await supabase
      .from("leads")
      .insert([{
        name,
        email,
        phone,
        message,
        property_id: propertyId,
        score: score,
        score_details: details
      }]);

    const response = NextResponse.json({ success: true, emailData });
    return addCorsHeaders(response);
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 400 });
    return addCorsHeaders(response);
  }
}
