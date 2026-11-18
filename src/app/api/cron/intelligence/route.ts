import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { runProspecting } from "@/lib/prospector";
import { chatEnabled } from "@/lib/gemini";
import { sendTelegramMessage, escapeTelegramHtml, telegramConfigured } from "@/lib/telegram";
import { sendEmail, emailShell, isEmailConfigured } from "@/lib/email";
import { notifyIndexNow, coreSiteUrls } from "@/lib/indexnow";
import { sendMonthlyDigest } from "@/lib/newsletter";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // límite del plan Hobby

/**
 * Tarea diaria de inteligencia (2º slot de cron del plan Hobby, 13:00 UTC):
 * 1) Prospección automática con Gemini + Google Search (gratis) → Prospect.
 * 2) Chequeo de salud: DB, chat IA, frescura de las tasas de cambio.
 * 3) Ping del sitemap a Google.
 * 4) Si algo falla, alerta por Telegram y email.
 *
 * Invocación: Bearer <CRON_SECRET> (Vercel cron) o sesión de admin
 * ("Buscar ahora" del panel de Prospectos).
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const fromCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  const fromAdmin = await isAuthenticated();
  if (!fromCron && !fromAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const problems: string[] = [];
  const summary: Record<string, unknown> = {};

  // 1) Prospección automática
  let prospecting: Awaited<ReturnType<typeof runProspecting>> | null = null;
  try {
    prospecting = await runProspecting();
    summary.prospecting = {
      inserted: prospecting.inserted,
      found: prospecting.found,
      mode: prospecting.mode,
    };
    if (prospecting.error) problems.push(`Prospección: ${prospecting.error}`);
  } catch (error) {
    problems.push(
      `Prospección: ${error instanceof Error ? error.message : "error desconocido"}`
    );
  }

  // 2) Chequeo de salud
  try {
    await prisma.siteConfig.count();
    summary.db = "ok";
  } catch {
    problems.push("Base de datos no responde");
    summary.db = "error";
  }

  summary.chatIA = chatEnabled() ? "ok" : "off";
  if (!chatEnabled()) problems.push("GEMINI_API_KEY no configurada (chat IA apagado)");

  try {
    const ratesRow = await prisma.siteConfig.findUnique({
      where: { key: "rates_ves_updated_at" },
    });
    const last = ratesRow?.value ? new Date(ratesRow.value) : null;
    const fresh = last && Date.now() - last.getTime() < 48 * 3600 * 1000;
    summary.tasas = fresh ? "ok" : "stale";
    if (!fresh) problems.push("Tasas de cambio desactualizadas (>48h)");
  } catch {
    summary.tasas = "unknown";
  }

  // 3) IndexNow (Bing y demás: indexación en horas, gratis) — el ping de
  //    Google a /ping?sitemap quedó deprecado (404); la indexación en Google
  //    se gestiona con Search Console.
  try {
    const ok = await notifyIndexNow(coreSiteUrls());
    summary.indexNow = ok ? "ok" : "sin respuesta";
  } catch {
    summary.indexNow = "error (no bloquea)";
  }

  // 4) Reporte semanal de negocio por Telegram (lunes) — el plan Hobby solo
  //    permite 2 crons, así que todo vive en esta ruta.
  if (new Date().getDay() === 1 && telegramConfigured()) {
    try {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      const [leads, prospectsSent, sales, subs] = await Promise.all([
        prisma.contact.count({ where: { createdAt: { gte: since } } }),
        prisma.prospect.count({ where: { status: "SENT", createdAt: { gte: since } } }),
        prisma.sale.count({ where: { createdAt: { gte: since } } }),
        prisma.subscriber.count({ where: { active: true } }),
      ]);
      await sendTelegramMessage(
        `📊 <b>Reporte semanal de Caskiuz</b>\n\n` +
          `🎯 Leads nuevos: <b>${leads}</b>\n` +
          `📤 Prospectos contactados: <b>${prospectsSent}</b>\n` +
          `💰 Ventas registradas: <b>${sales}</b>\n` +
          `📬 Suscriptores activos: <b>${subs}</b>\n\n` +
          (leads === 0
            ? `💡 Sin leads esta semana: considera publicar un post, compartir tus links de afiliados o subir el volumen de prospección.`
            : `¡Sigue así! 🚀`)
      );
      summary.reporteSemanal = "enviado";
    } catch {
      summary.reporteSemanal = "error (no bloquea)";
    }
  }

  // 5) Digest mensual a suscriptores (1º de mes) — el newsletter que antes
  //    estaba muerto: artículos nuevos + oferta + enlace de baja.
  if (new Date().getDate() === 1) {
    try {
      const digest = await sendMonthlyDigest();
      summary.digest = digest;
    } catch {
      summary.digest = "error (no bloquea)";
    }
  }

  // 6) Alerta si hubo problemas
  if (problems.length > 0) {
    const alertText =
      `⚠️ <b>Cron de inteligencia — ${problems.length} problema(s)</b>\n\n` +
      problems.map((p) => `• ${escapeTelegramHtml(p)}`).join("\n");
    await sendTelegramMessage(alertText);

    if (isEmailConfigured()) {
      try {
        const cfg = await prisma.siteConfig.findUnique({ where: { key: "contact_email" } });
        const adminEmail = process.env.ADMIN_EMAIL || cfg?.value;
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: "⚠️ Cron de inteligencia — problemas detectados",
            html: emailShell(`
              <h2 style="margin:0 0 12px;">Problemas del chequeo diario</h2>
              <ul>${problems.map((p) => `<li>${p}</li>`).join("")}</ul>
              <p>Revisa el panel de Prospectos o las variables de entorno.</p>
            `),
          }).catch(() => {});
        }
      } catch {
        // no bloquea
      }
    }
  }

  console.log(
    `🧠 Cron inteligencia: ${prospecting?.inserted ?? 0} prospectos nuevos · salud: ${problems.length || "todo ok"}`
  );

  return NextResponse.json({
    success: problems.length === 0,
    ...summary,
    prospecting: prospecting ?? null,
    problems,
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
