import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { collectAndScoreJobs, draftJobApplication } from "@/lib/job-intel";
import { sendTelegramMessage, escapeTelegramHtml } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return null;
}

const VALID_STATUSES = ["NEW", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "LOST"];

export async function GET(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  if (request.nextUrl.searchParams.get("stats")) {
    const count = await prisma.jobOpportunity.count({
      where: { status: "NEW", score: { gte: 70 } },
    });
    return NextResponse.json({ count });
  }

  const opportunities = await prisma.jobOpportunity.findMany({
    orderBy: [{ status: "asc" }, { score: "desc" }, { createdAt: "desc" }],
    take: 120,
  });
  return NextResponse.json({ opportunities });
}

/** Acciones: { action: "run" } recolecta ahora; { action: "draft", id } genera la carta. */
export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));

  if (body.action === "draft") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const letter = await draftJobApplication(id);
    if (!letter) {
      return NextResponse.json(
        { error: "No se pudo generar la carta (cuota de IA agotada o IA caída). Intenta en un rato." },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, letter });
  }

  // action === "run" (por defecto)
  try {
    const stats = await collectAndScoreJobs({ maxScore: 8 });
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error recolectando vacantes:", error);
    return NextResponse.json({ error: "La recolección falló" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id, status } = await request.json();
    if (!Number.isInteger(Number(id)) || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const jobId = Number(id);
    const prev = await prisma.jobOpportunity.findUnique({ where: { id: jobId } });
    if (!prev) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const data: Record<string, unknown> = { status };
    if (status === "APPLIED" && !prev.appliedAt) {
      data.appliedAt = new Date();
      data.followUpAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // recordatorio a 7 días
    } else if (status === "APPLIED") {
      data.followUpAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    }

    const updated = await prisma.jobOpportunity.update({ where: { id: jobId }, data });

    // Avisos de progreso (entrevista/oferta) por Telegram
    if (status === "INTERVIEW" || status === "OFFER") {
      await sendTelegramMessage(
        status === "INTERVIEW"
          ? `🎤 <b>¡Entrevista!</b>\n\n<b>${escapeTelegramHtml(updated.title)}</b> — ${escapeTelegramHtml(updated.company)}\n${updated.url}`
          : `🏆 <b>¡OFERTA!</b>\n\n<b>${escapeTelegramHtml(updated.title)}</b> — ${escapeTelegramHtml(updated.company)}\n${updated.url}`
      );
    }

    return NextResponse.json({ success: true, opportunity: updated });
  } catch {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  try {
    await prisma.jobOpportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
}
