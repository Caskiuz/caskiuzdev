import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import {
  outreachConfigured,
  outreachDailyCap,
  outreachProvider,
  sendProspectOutreach,
} from "@/lib/prospect-outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const fromCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  return fromCron || (await isAuthenticated());
}

/** Estado de la campaña: proveedor, tope diario y cuántos esperan email. */
export async function GET(request: NextRequest) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const pending = await prisma.prospect
    .count({
      where: {
        status: "NEW",
        emailOptOut: false,
        outreachCount: 0,
        contactVerified: true,
        email: { not: null },
      },
    })
    .catch(() => 0);
  return NextResponse.json({
    configured: outreachConfigured(),
    provider: outreachProvider(),
    dailyCap: outreachDailyCap(),
    pending,
  });
}

/** Envía la cola (o previsualiza con dryRun:true). */
export async function POST(request: NextRequest) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let body: { limit?: number; dryRun?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // body vacío: valores por defecto
  }
  try {
    const result = await sendProspectOutreach({
      limit: Number(body.limit) || undefined,
      dryRun: Boolean(body.dryRun),
    });
    return NextResponse.json(result, { status: result.error && !result.configured ? 400 : 200 });
  } catch (error) {
    console.error("Error en outreach:", error);
    return NextResponse.json({ error: "El envío falló. Revisa los logs." }, { status: 500 });
  }
}
