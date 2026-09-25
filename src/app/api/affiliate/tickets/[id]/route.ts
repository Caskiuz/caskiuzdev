import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: Number(id), affiliateId: affiliate.id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }
  return NextResponse.json(ticket);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ticketId = Number(id);

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, affiliateId: affiliate.id },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }
    if (ticket.status === "CLOSED") {
      return NextResponse.json(
        { error: "Este ticket está cerrado. Crea uno nuevo si necesitas más ayuda." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message } = body;
    if (!message || String(message).length > 5000) {
      return NextResponse.json({ error: "Mensaje inválido." }, { status: 400 });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        author: "AFFILIATE",
        message: String(message).trim(),
      },
    });

    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (error) {
    console.error("Error respondiendo ticket:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
