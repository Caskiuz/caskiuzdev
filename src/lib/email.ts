import { Resend } from "resend";

/**
 * Envío de emails transaccionales.
 * Proveedores soportados, por orden de prioridad:
 *  1. Brevo  (BREVO_API_KEY)  — 300 correos/día gratis; requiere verificar el remitente.
 *  2. Resend (RESEND_API_KEY) — respaldo.
 * Si no hay ninguno configurado, registra en consola y no falla
 * (el sitio sigue funcionando sin emails).
 */

const FROM =
  process.env.EMAIL_FROM ||
  process.env.RESEND_FROM ||
  "Caskiuz Affiliates <onboarding@resend.dev>";

interface SendOptions {
  to: string;
  subject: string;
  html: string;
}

/** ¿Hay algún proveedor de correo configurado? */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY || process.env.RESEND_API_KEY);
}

/** Convierte "Nombre <correo>" en { name, email }. */
function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1] || "Caskiuz Afiliados", email: match[2] };
  return { name: "Caskiuz Afiliados", email: from.trim() };
}

async function sendViaBrevo({ to, subject, html }: SendOptions): Promise<boolean> {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY as string,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: parseFrom(FROM),
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Error enviando email (Brevo):", response.status, detail);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error enviando email (Brevo):", error);
    return false;
  }
}

async function sendViaResend({ to, subject, html }: SendOptions): Promise<boolean> {
  const resend = new Resend(process.env.RESEND_API_KEY as string);
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("Error enviando email (Resend):", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error enviando email (Resend):", error);
    return false;
  }
}

export async function sendEmail({ to, subject, html }: SendOptions): Promise<boolean> {
  if (process.env.BREVO_API_KEY) return sendViaBrevo({ to, subject, html });
  if (process.env.RESEND_API_KEY) return sendViaResend({ to, subject, html });
  console.log(`✉️ [EMAIL NO ENVIADO - sin proveedor configurado] ${subject} → ${to}`);
  return false;
}

const baseStyle = `
  font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #e4e4eb; line-height: 1.6;
`;
const wrapper = `
  <div style="background:#0a0a0f;padding:40px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#13131a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
      <div style="padding:24px 32px;background:linear-gradient(135deg,#1e3a8a,#0ea5e9);">
        <span style="font-weight:700;font-size:18px;letter-spacing:0.5px;background:linear-gradient(135deg,#e8ecf1,#9aa7b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">CASKIUZ AFFILIATES</span>
      </div>
      <div style="padding:32px;${baseStyle}">
`;

export function emailShell(innerHtml: string): string {
  return `${wrapper}${innerHtml}
        <p style="margin-top:32px;font-size:12px;color:#8888a0;">Este es un correo automático. Si no solicitaste este mensaje, ignóralo.</p>
      </div>
    </div>
  </div>`;
}
