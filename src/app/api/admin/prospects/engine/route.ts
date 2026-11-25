import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runOsmProspecting } from "@/lib/prospect-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const fromCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  return fromCron || (await isAuthenticated());
}

/**
 * Descubrimiento masivo con OpenStreetMap (gratis, sin IA ni cuotas).
 * POST { maxVerify?: number, budgetMs?: number }
 */
export async function POST(request: NextRequest) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let body: { maxVerify?: number; budgetMs?: number } = {};
  try {
    body = await request.json();
  } catch {
    // defaults
  }
  try {
    const stats = await runOsmProspecting({
      maxVerify: Math.min(Math.max(Number(body.maxVerify) || 50, 10), 90),
      budgetMs: Math.min(Math.max(Number(body.budgetMs) || 48000, 10000), 55000),
    });
    return NextResponse.json(stats, { status: stats.error ? 502 : 200 });
  } catch (error) {
    console.error("Error en motor OSM:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "El motor falló" },
      { status: 500 }
    );
  }
}
