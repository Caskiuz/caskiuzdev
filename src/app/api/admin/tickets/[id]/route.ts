import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { sendEmail, emailShell } from "@/lib/email";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

/** Responder como ADMIN (reabre el ticket si estaba cerrado). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const ticketId = Number(id);
    const body = await request.json();
    const { message } = body;

    if (!message || String(message).length > 5000) {
      return NextResponse.json({ error: "Mensaje inválido." }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { affiliate: true },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const reply = await prisma.$transaction(async (tx) => {
      if (ticket.status === "CLOSED") {
        await tx.supportTicket.update({ where: { id: ticketId }, data: { status: "OPEN" } });
      }
      return tx.ticketReply.create({
        data: { ticketId, author: "ADMIN", message: String(message).trim() },
      });
    });

    await sendEmail({
      to: ticket.affiliate.email,
      subject: "💬 Nueva respuesta de soporte — Caskiuz Affiliates",
      html: emailShell(`
        <h2 style="margin:0 0 12px;">Respuesta de soporte</h2>
        <p>Tu ticket "<strong>${ticket.subject}</strong>" tiene una nueva respuesta:</p>
        <div style="background:#1c1c28;border-radius:8px;padding:14px;margin:12px 0;">
          ${String(message).trim().slice(0, 2000)}
        </div>
        <p>Responde desde tu panel: <a href="https://caskiuz.vercel.app/afiliados/panel/soporte" style="color:#38bdf8;">afiliados/panel/soporte</a></p>
      `),
    });

    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (error) {
    console.error("Error respondiendo ticket:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/** Cerrar o reabrir un ticket. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const ticketId = Number(id);
    const body = await request.json();
    const { status } = body;

    if (!["OPEN", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Error actualizando ticket:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
