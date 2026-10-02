import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

/**
 * Marca anuncios como leídos por el afiliado actual.
 * Cuerpo: { ids: number[] }. Idempotente (skipDuplicates).
 */
export async function POST(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawIds: unknown[] = Array.isArray(body.ids) ? body.ids : [];
  const ids = rawIds
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, 100);

  if (ids.length === 0) {
    return NextResponse.json({ error: "Sin anuncios que marcar." }, { status: 400 });
  }

  // Solo se permiten anuncios reales (evita filas huérfanas)
  const existing = await prisma.announcement.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  await prisma.announcementRead.createMany({
    data: existing.map((a) => ({ announcementId: a.id, affiliateId: affiliate.id })),
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true, marked: existing.length });
}
