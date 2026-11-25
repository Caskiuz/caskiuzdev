/**
 * Outreach por email para prospectos — el único canal que puede enviarse
 * 100% automático (WhatsApp y Telegram requieren un toque humano porque las
 * APIs gratuitas no permiten iniciar conversaciones).
 *
 * Reglas de convivencia y cumplimiento:
 * - Solo prospectos con email VERIFICADO (dominio con MX) y contacto verificado.
 * - Un solo email por prospecto (outreachCount 0) y tope diario configurable
 *   (20 por defecto, máx. 40) para no quemar la reputación del remitente.
 * - Enlace de baja en cada correo + cabecera List-Unsubscribe (one-click).
 * - Brevo free (300/día) es el proveedor recomendado; SMTP solo si se activa
 *   explícitamente con OUTREACH_VIA_SMTP=1.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/email";
import { escapeTelegramHtml, sendTelegramMessage, telegramConfigured } from "@/lib/telegram";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://caskiuz.vercel.app").replace(/\/$/, "");
const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || "584262931869").replace(/\D/g, "");
const SECRET =
  process.env.OUTREACH_SECRET ||
  process.env.CRON_SECRET ||
  process.env.AUTH_SECRET ||
  "caskiuz-outreach-2026";

const FROM =
  process.env.OUTREACH_FROM ||
  process.env.EMAIL_FROM ||
  "Ricardo Agelvis <rijarcwow@gmail.com>";

type OutreachProvider = "brevo" | "smtp" | "resend";

/** Proveedor disponible para la campaña (Brevo primero). */
export function outreachProvider(): OutreachProvider | null {
  if (process.env.BREVO_API_KEY) return "brevo";
  if (process.env.OUTREACH_VIA_SMTP === "1" && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return "smtp";
  }
  // Resend solo sirve con dominio verificado; se permite si se fuerza.
  if (process.env.OUTREACH_VIA_RESEND === "1" && process.env.RESEND_API_KEY) return "resend";
  return null;
}

export function outreachConfigured(): boolean {
  return outreachProvider() !== null;
}

/** Tope diario efectivo (env, 20 por defecto, nunca más de 40). */
export function outreachDailyCap(): number {
  const n = Number(process.env.PROSPECT_EMAIL_DAILY) || 20;
  return Math.max(1, Math.min(40, n));
}

function tokenFor(id: number, email: string): string {
  return createHmac("sha256", SECRET).update(`${id}|${email}`).digest("hex").slice(0, 32);
}

export function unsubscribeUrl(id: number, email: string): string {
  return `${SITE}/api/outreach/unsubscribe?id=${id}&token=${tokenFor(id, email)}`;
}

export function verifyUnsubscribeToken(id: number, email: string, token: string): boolean {
  const expected = tokenFor(id, email);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ProspectForEmail {
  id: number;
  businessName: string;
  niche: string;
  region: string;
  email: string | null;
  siteUrl: string | null;
  channel: string | null;
  draftMessage: string;
  score: number;
}

function emailBody(p: ProspectForEmail): { subject: string; html: string } {
  const hasSite = Boolean(p.siteUrl);
  const intro = hasSite
    ? `Vi que <strong>${esc(p.businessName)}</strong> ya tiene presencia online, y creo que hay una forma rápida de convertir más visitas en clientes.`
    : `Encontré <strong>${esc(p.businessName)}</strong> en el mapa público de ${esc(p.region)} y noté que todavía no tienen una web propia. Eso es una oportunidad concreta: hoy sus clientes los buscan en Google y no los encuentran.`;
  const offer = hasSite
    ? "Un chatbot de WhatsApp con IA que responde consultas y agenda citas solo, más una optimización de su web actual para que venda mejor."
    : "Una web rápida y moderna, con catálogo y botón de WhatsApp, lista en pocos días y desde $149.";
  const subject = hasSite
    ? `Una idea rápida para ${p.businessName}`
    : `${p.businessName}: sus clientes los buscan en Google y no los encuentran`;

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#0a0a0f;">
<div style="background:#0a0a0f;padding:32px 14px;">
  <div style="max-width:560px;margin:0 auto;background:#13131a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4eb;">
    <div style="padding:20px 30px;background:linear-gradient(135deg,#1e3a8a,#0ea5e9);">
      <span style="font-weight:800;font-size:18px;letter-spacing:.6px;color:#fff;">CASKIUZ</span>
      <span style="font-size:11px;color:rgba(255,255,255,.8);margin-left:8px;">Desarrollo web &amp; automatización con IA</span>
    </div>
    <div style="padding:30px;line-height:1.65;font-size:15px;">
      <p style="margin:0 0 14px;">Hola, equipo de <strong>${esc(p.businessName)}</strong>:</p>
      <p style="margin:0 0 14px;color:#b9b9c9;">${intro}</p>
      <p style="margin:0 0 6px;color:#b9b9c9;">Soy Ricardo Agelvis (Caskiuz), desarrollador full-stack. Trabajo con negocios de Latinoamérica en:</p>
      <ul style="margin:0 0 18px;padding-left:20px;color:#b9b9c9;">
        <li style="margin:6px 0;">${offer}</li>
        <li style="margin:6px 0;">Webs y landings que convierten visitas en pedidos (desde $149).</li>
        <li style="margin:6px 0;">Automatización de redes sociales y respuestas con IA.</li>
      </ul>
      <p style="margin:0 0 20px;color:#b9b9c9;">Puedo mostrarle una propuesta breve y sin compromiso, pensada para ${esc(p.niche.toLowerCase())}s en ${esc(p.region)}. ¿Le interesa?</p>
      <div style="margin:0 0 22px;">
        <a href="${SITE}/cv" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:14px;">Ver mi trabajo</a>
        <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola Ricardo, vi tu correo sobre ${p.businessName} y quiero saber más`)}" style="display:inline-block;margin-left:8px;background:#25D366;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:14px;">Hablar por WhatsApp</a>
      </div>
      <p style="margin:0;color:#b9b9c9;">Responder a este correo también me llega directamente.</p>
      <p style="margin:18px 0 0;color:#e4e4eb;font-weight:600;">Ricardo Agelvis · Caskiuz<br><span style="font-weight:400;font-size:13px;color:#8888a0;">Desarrollador Full-Stack &amp; Automatización IA</span></p>
    </div>
    <div style="padding:16px 30px;border-top:1px solid rgba(255,255,255,.07);font-size:11px;color:#77778c;line-height:1.5;">
      Recibes este correo porque el contacto de ${esc(p.businessName)} aparece públicamente en OpenStreetMap y tu negocio encaja con los servicios que ofrezco.
      Si no quieres recibir más mensajes, <a href="${unsubscribeUrl(p.id, p.email || "")}" style="color:#9aa7b8;">date de baja aquí</a>.
    </div>
  </div>
</div>
</body></html>`;

  return { subject, html };
}

export interface OutreachResult {
  configured: boolean;
  provider: string | null;
  sent: number;
  failed: number;
  skipped: number;
  remainingToday: number;
  previews?: { to: string; subject: string }[];
  error?: string;
}

/**
 * Envía la cola de emails de prospección.
 * @param opts.limit máximo a enviar en esta corrida
 * @param opts.dryRun solo devuelve previews, no envía
 */
export async function sendProspectOutreach(opts?: {
  limit?: number;
  dryRun?: boolean;
}): Promise<OutreachResult> {
  const provider = outreachProvider();
  const cap = outreachDailyCap();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const sentToday = await prisma.prospect
    .count({ where: { lastOutreachAt: { gte: startOfDay } } })
    .catch(() => 0);
  const remainingToday = Math.max(0, cap - sentToday);

  if (!provider) {
    return {
      configured: false,
      provider: null,
      sent: 0,
      failed: 0,
      skipped: 0,
      remainingToday,
      error:
        "Outreach sin proveedor: configura Gmail SMTP (SMTP_USER/SMTP_PASS + OUTREACH_VIA_SMTP=1) o un dominio verificado en Resend.",
    };
  }

  // Resend sin dominio propio solo puede enviar al correo dueño de la cuenta.
  // Se corta con un mensaje claro en vez de fallar prospecto por prospecto.
  if (provider === "resend" && /(resend\.dev|gmail\.com|hotmail\.com|outlook\.com)/i.test(FROM)) {
    return {
      configured: false,
      provider,
      sent: 0,
      failed: 0,
      skipped: 0,
      remainingToday,
      error:
        "Resend sin dominio verificado: solo puede enviar a tu propio correo. Verifica un dominio en resend.com/domains o usa Gmail SMTP gratis (OUTREACH_VIA_SMTP=1).",
    };
  }

  const limit = Math.max(1, Math.min(opts?.limit ?? 20, remainingToday));
  if (remainingToday === 0) {
    return {
      configured: true,
      provider,
      sent: 0,
      failed: 0,
      skipped: 0,
      remainingToday: 0,
      error: `Tope diario alcanzado (${cap}/día).`,
    };
  }

  const candidates = await prisma.prospect.findMany({
    where: {
      status: "NEW",
      emailOptOut: false,
      outreachCount: 0,
      contactVerified: true,
      email: { not: null },
    },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: limit * 2, // margen para descartar emails basura
    select: {
      id: true,
      businessName: true,
      niche: true,
      region: true,
      email: true,
      siteUrl: true,
      channel: true,
      draftMessage: true,
      score: true,
    },
  });

  const usable = candidates.filter(
    (p) =>
      p.email &&
      /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(p.email) &&
      !/^(no-?reply|donotreply|postmaster)@/i.test(p.email) &&
      // España exige consentimiento previo para email comercial (LSSI/GDPR):
      // esos prospectos quedan para contacto manual, no para envío automático.
      !/España/i.test(p.region)
  );

  if (opts?.dryRun) {
    return {
      configured: true,
      provider,
      sent: 0,
      failed: 0,
      skipped: usable.length,
      remainingToday,
      previews: usable.slice(0, 5).map((p) => ({
        to: p.email!,
        subject: emailBody(p).subject,
      })),
    };
  }

  let sent = 0;
  let failed = 0;
  const sentNames: string[] = [];

  for (const p of usable.slice(0, limit)) {
    const { subject, html } = emailBody(p);
    const ok = await sendEmail({
      to: p.email!,
      subject,
      html,
      from: FROM,
      provider,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl(p.id, p.email!)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (ok) {
      await prisma.prospect
        .update({
          where: { id: p.id },
          data: { outreachCount: { increment: 1 }, lastOutreachAt: new Date() },
        })
        .catch(() => {});
      sent++;
      sentNames.push(p.businessName);
    } else {
      failed++;
    }
    // Pequeña pausa para no ráfaguear al proveedor
    await new Promise((r) => setTimeout(r, 250));
  }

  if (sent > 0 && telegramConfigured()) {
    await sendTelegramMessage(
      `📧 <b>Outreach enviado: ${sent} email(s)</b>\n\n` +
        sentNames
          .slice(0, 8)
          .map((n) => `• ${escapeTelegramHtml(n)}`)
          .join("\n") +
        `\n\nQuedan ${Math.max(0, remainingToday - sent)} hoy.`
    );
  }

  return {
    configured: true,
    provider,
    sent,
    failed,
    skipped: Math.max(0, usable.length - sent - failed),
    remainingToday: Math.max(0, remainingToday - sent),
  };
}
