/**
 * Utilidades del newsletter (email de baja con token, digest mensual).
 */

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma/client";
import { sendEmail, emailShell, isEmailConfigured } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";
import { blogPosts } from "@/lib/blog-data";

const UNSUB_SALT = "caskiuz-unsub-2026";

/** Token de baja determinístico (no requiere env): sha256(email|salt). */
export function unsubToken(email: string): string {
  return createHash("sha256")
    .update(`${email.toLowerCase().trim()}|${UNSUB_SALT}`)
    .digest("hex")
    .slice(0, 20);
}

export function unsubLink(email: string): string {
  return `https://caskiuz.vercel.app/api/subscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Digest mensual a los suscriptores activos (1º de mes, llamado desde el cron
 * de inteligencia). Gratis: Brevo 300/día cubre una lista pequeña.
 * Devuelve cuántos correos se enviaron.
 */
export async function sendMonthlyDigest(): Promise<{ sent: number; total: number }> {
  if (!isEmailConfigured()) return { sent: 0, total: 0 };

  const subscribers = await prisma.subscriber
    .findMany({ where: { active: true }, select: { email: true }, take: 150 })
    .catch(() => []);

  const latest = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  let sent = 0;
  for (const sub of subscribers) {
    if (!EMAIL_RE.test(sub.email)) continue;
    const ok = await sendEmail({
      to: sub.email,
      subject: `🗞️ Newsletter Caskiuz — ${latest?.title ?? "Novedades del mes"}`,
      html: emailShell(`
        <h2 style="margin:0 0 12px;">Lo nuevo este mes 👇</h2>
        ${
          latest
            ? `<p><strong>Artículo destacado:</strong></p>
               <p><a href="https://caskiuz.vercel.app/blog/${latest.slug}" style="color:#38bdf8;font-weight:600;">${latest.title}</a></p>
               <p style="font-size:14px;color:#8888a0;">${latest.excerpt}</p>`
            : ""
        }
        <p style="margin:20px 0;"><strong>Oferta del mes:</strong> web profesional desde <strong>$149 USD</strong> · Chatbot de WhatsApp con IA desde <strong>$199 setup + $49/mes</strong> · Propuesta preliminar con IA en minutos.</p>
        <p style="margin:20px 0;"><a href="https://caskiuz.vercel.app/#contact" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Cotizar en 3 pasos</a></p>
        <p style="font-size:13px;color:#8888a0;">¿Tienes audiencia? Gana hasta 40% de comisión con nuestro <a href="https://caskiuz.vercel.app/afiliados" style="color:#38bdf8;">programa de afiliados</a>.</p>
        <p style="font-size:12px;color:#8888a0;"><a href="${unsubLink(sub.email)}" style="color:#8888a0;">Darme de baja</a></p>
      `),
    });
    if (ok) sent++;
  }

  if (subscribers.length) {
    await sendTelegramMessage(
      `🗞️ <b>Digest mensual enviado</b>\n📬 Correos: ${sent}/${subscribers.length}`
    );
  }
  return { sent, total: subscribers.length };
}
