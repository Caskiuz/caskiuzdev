import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { runProspecting } from "@/lib/prospector";
import { chatEnabled } from "@/lib/gemini";
import { sendTelegramMessage, escapeTelegramHtml } from "@/lib/telegram";
import { sendEmail, emailShell, isEmailConfigured } from "@/lib/email";

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

  // 3) Ping del sitemap a Google
  try {
    const pingRes = await fetch(
      "https://www.google.com/ping?sitemap=https://caskiuz.vercel.app/sitemap.xml",
      { signal: AbortSignal.timeout(8000) }
    );
    summary.sitemapPing = pingRes.ok ? "ok" : `HTTP ${pingRes.status}`;
  } catch {
    summary.sitemapPing = "error (no bloquea)";
  }

  // 4) Alerta si hubo problemas
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
