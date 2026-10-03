import { Resend } from "resend";
import nodemailer from "nodemailer";

/**
 * Envío de emails transaccionales.
 * Proveedores soportados: Brevo (API), SMTP (nodemailer; por defecto Gmail) y Resend.
 * La elección se controla con EMAIL_PROVIDER: "brevo" | "smtp" | "resend".
 * Sin EMAIL_PROVIDER, el orden automático es Brevo → SMTP → Resend
 * (Resend queda último a propósito: sin dominio verificado solo puede enviar
 * al correo del dueño de la cuenta).
 * Si no hay ningún proveedor configurado, registra en consola y no falla
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

type EmailProvider = "brevo" | "smtp" | "resend";

function hasBrevo(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

function hasSmtp(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function hasResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Proveedor activo según EMAIL_PROVIDER o el orden automático. */
function activeProvider(): EmailProvider | null {
  const explicit = (process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  if (explicit === "brevo") return hasBrevo() ? "brevo" : null;
  if (explicit === "smtp") return hasSmtp() ? "smtp" : null;
  if (explicit === "resend") return hasResend() ? "resend" : null;
  if (hasBrevo()) return "brevo";
  if (hasSmtp()) return "smtp";
  if (hasResend()) return "resend";
  return null;
}

/** ¿Hay algún proveedor de correo configurado y activo? */
export function isEmailConfigured(): boolean {
  return activeProvider() !== null;
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

async function sendViaSmtp({ to, subject, html }: SendOptions): Promise<boolean> {
  try {
    const port = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASS as string,
      },
    });
    await transporter.sendMail({ from: FROM, to, subject, html });
    return true;
  } catch (error) {
    console.error("Error enviando email (SMTP):", error);
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
  const provider = activeProvider();
  if (provider === "brevo") return sendViaBrevo({ to, subject, html });
  if (provider === "smtp") return sendViaSmtp({ to, subject, html });
  if (provider === "resend") return sendViaResend({ to, subject, html });
  console.log(
    `✉️ [EMAIL NO ENVIADO - proveedor sin configurar] ${subject} → ${to} (configura SMTP_USER/SMTP_PASS, BREVO_API_KEY o RESEND_API_KEY)`
  );
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
