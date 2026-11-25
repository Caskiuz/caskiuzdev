import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runOsmProspecting } from "@/lib/prospect-engine";
import { collectAndScoreJobs } from "@/lib/job-intel";
import { outreachConfigured, sendProspectOutreach } from "@/lib/prospect-outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Tick del motor continuo (lo llama GitHub Actions cada 30 min, gratis).
 *
 * El plan Hobby de Vercel solo permite 2 crons diarios, así que el trabajo
 * pesado se reparte en ticks que nunca coinciden:
 *   - tick par  → descubrimiento masivo OSM (prospectos frescos)
 *   - tick impar → recolección de vacantes + emails de outreach
 *
 * Cada tick vive menos de 60s y es idempotente: si se solapa o falla, el
 * siguiente retoma sin duplicar (dedupe por externalId/email).
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const fromCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  const fromAdmin = await isAuthenticated();
  if (!fromCron && !fromAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const requested = request.nextUrl.searchParams.get("mode") || "auto";
  const tick = Math.floor(Date.now() / (30 * 60 * 1000));
  const mode =
    requested === "auto" ? (tick % 2 === 0 ? "prospects" : "jobs") : requested;

  const result: Record<string, unknown> = { mode, tick };

  try {
    if (mode === "prospects" || mode === "all") {
      result.prospects = await runOsmProspecting({ budgetMs: 45000, maxVerify: 40 });
    }
    if (mode === "jobs" || mode === "all") {
      // 8 vacantes = 2 lotes de IA: cabe holgado en los 60s del plan Hobby
      // incluso con los 10 fetchers de fuentes en frío.
      result.jobs = await collectAndScoreJobs({ maxScore: 8 });
      if (outreachConfigured()) {
        result.outreach = await sendProspectOutreach({ limit: 8 });
      }
    }
    if (mode === "email") {
      result.outreach = await sendProspectOutreach({ limit: 10 });
    }
  } catch (error) {
    console.error("Error en tick del motor:", error);
    result.error = error instanceof Error ? error.message : "error desconocido";
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
