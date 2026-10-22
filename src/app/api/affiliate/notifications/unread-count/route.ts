import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAffiliateId } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

/** Contador de avisos sin leer del afiliado (para el polling del badge). */
export async function GET() {
  const affiliateId = await getAffiliateId();
  if (!affiliateId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const count = await prisma.notification.count({
    where: { recipientType: "AFFILIATE", recipientId: affiliateId, read: false },
  });

  return NextResponse.json({ count });
}
