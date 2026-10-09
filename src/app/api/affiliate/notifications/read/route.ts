import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

/** Marca como leídas las notificaciones del afiliado en sesión (máx. 500). */
export async function POST(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? (body.ids as unknown[])
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n > 0)
          .slice(0, 500)
      : [];

    const where = ids.length
      ? { recipientType: "AFFILIATE", recipientId: affiliate.id, id: { in: ids } }
      : { recipientType: "AFFILIATE", recipientId: affiliate.id, read: false };

    const result = await prisma.notification.updateMany({
      where,
      data: { read: true },
    });

    return NextResponse.json({ success: true, marked: result.count });
  } catch (error) {
    console.error("Error marcando notificaciones del afiliado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
