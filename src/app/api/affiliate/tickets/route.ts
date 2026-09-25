import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { affiliateId: affiliate.id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Asunto y mensaje son requeridos." },
        { status: 400 }
      );
    }
    if (String(subject).length > 160 || String(message).length > 5000) {
      return NextResponse.json({ error: "Texto demasiado largo." }, { status: 400 });
    }

    const openTickets = await prisma.supportTicket.count({
      where: { affiliateId: affiliate.id, status: "OPEN" },
    });
    if (openTickets >= 5) {
      return NextResponse.json(
        { error: "Límite de 5 tickets abiertos. Espera a que resolvamos los existentes." },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        affiliateId: affiliate.id,
        subject: String(subject).trim(),
        message: String(message).trim(),
      },
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    console.error("Error creando ticket:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
