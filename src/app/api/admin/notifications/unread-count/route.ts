import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Contador de avisos sin leer del admin actual (para el polling del badge). */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const count = await prisma.notification.count({
    where: { recipientType: "ADMIN", recipientId: admin.id, read: false },
  });

  return NextResponse.json({ count });
}
