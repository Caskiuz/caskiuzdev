import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { runProspecting } from "@/lib/prospector";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

/** Contador para el badge del sidebar (?stats=1). */
export async function GET(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  if (request.nextUrl.searchParams.get("stats")) {
    const count = await prisma.prospect.count({ where: { status: "NEW" } });
    return NextResponse.json({ count });
  }

  const prospects = await prisma.prospect.findMany({
    orderBy: [{ status: "asc" }, { score: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return NextResponse.json({ prospects });
}

/** "Buscar ahora": ejecuta una ronda de prospección con IA (Gemini + Google). */
export async function POST() {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const result = await runProspecting();
    return NextResponse.json(result, { status: result.error ? 502 : 200 });
  } catch (error) {
    console.error("Error en prospección manual:", error);
    return NextResponse.json(
      { error: "La prospección falló. Revisa los logs." },
      { status: 500 }
    );
  }
}

/** Cambia el estado: NEW | SENT | DISCARDED (enviar/descartar/restaurar). */
export async function PATCH(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id, status } = await request.json();
    if (!Number.isInteger(Number(id)) || !["NEW", "SENT", "DISCARDED"].includes(status)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const updated = await prisma.prospect.update({
      where: { id: Number(id) },
      data: { status },
    });
    return NextResponse.json({ success: true, prospect: updated });
  } catch {
    return NextResponse.json({ error: "Prospecto no encontrado" }, { status: 404 });
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
    await prisma.prospect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Prospecto no encontrado" }, { status: 404 });
  }
}
