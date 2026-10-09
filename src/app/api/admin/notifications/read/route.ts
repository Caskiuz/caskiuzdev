import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Marca como leídas las notificaciones del admin (ids opcionales; máx. 500). */
export async function POST(request: NextRequest) {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
      ? { recipientType: "ADMIN", id: { in: ids } }
      : { recipientType: "ADMIN", read: false };

    const result = await prisma.notification.updateMany({
      where,
      data: { read: true },
    });

    return NextResponse.json({ success: true, marked: result.count });
  } catch (error) {
    console.error("Error marcando notificaciones del admin:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
