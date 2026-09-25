import { Resend } from "resend";

/**
 * Envío de emails transaccionales vía Resend.
 * Si no hay API key configurada, registra en consola y no falla
 * (el sitio sigue funcionando sin emails).
 */

const FROM =
  process.env.RESEND_FROM || "Caskiuz Affiliates <onboarding@resend.dev>";

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendOptions): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.log(`✉️ [EMAIL NO ENVIADO - Resend sin configurar] ${subject} → ${to}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("Error enviando email:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error enviando email:", error);
    return false;
  }
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
