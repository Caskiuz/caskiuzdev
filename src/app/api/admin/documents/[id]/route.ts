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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  const { id } = await params;
  const document = await prisma.affiliateDocument.findUnique({
    where: { id: Number(id) },
    include: { affiliate: { select: { id: true, name: true, email: true } } },
  });
  if (!document) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }
  return NextResponse.json(document);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const documentId = Number(id);
    const body = await request.json();
    const { status, notes } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    const document = await prisma.affiliateDocument.findUnique({
      where: { id: documentId },
      include: { affiliate: true },
    });
    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    const updated = await prisma.affiliateDocument.update({
      where: { id: documentId },
      data: {
        status,
        notes: notes ? String(notes).slice(0, 2000) : document.notes,
        reviewedAt: new Date(),
      },
    });

    await sendEmail({
      to: document.affiliate.email,
      subject:
        status === "APPROVED"
          ? "✅ Documento aprobado — Caskiuz Affiliates"
          : "⚠️ Documento rechazado — Caskiuz Affiliates",
      html: emailShell(`
        <h2 style="margin:0 0 12px;">Revisión de tu documento</h2>
        <p>Tu documento <strong>${document.type}</strong> fue <strong>${
          status === "APPROVED" ? "aprobado" : "rechazado"
        }</strong>.</p>
        ${notes ? `<p><strong>Nota del equipo:</strong> ${String(notes).slice(0, 2000)}</p>` : ""}
        <p>Revisa tu panel: <a href="https://caskiuz.vercel.app/afiliados/panel/documentos" style="color:#38bdf8;">afiliados/panel/documentos</a></p>
      `),
    });

    console.log(`📄 Documento #${documentId} → ${status}`);
    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error("Error revisando documento:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
