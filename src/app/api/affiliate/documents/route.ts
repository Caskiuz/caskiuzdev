import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["ID"]; // solo verificación de identidad; el contrato se acepta en el registro
// El cuerpo viaja como base64 (+33%) y Vercel limita cada petición a 4.5 MB,
// por eso el tope real del archivo es ~3 MB (las fotos se optimizan en el cliente).
const MAX_BASE64_LENGTH = 4_300_000; // ~3 MB
const ALLOWED_DATA_URL = /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/i;

export async function GET() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const documents = await prisma.affiliateDocument.findMany({
    where: { affiliateId: affiliate.id },
    select: { id: true, type: true, fileName: true, status: true, notes: true, createdAt: true, reviewedAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, fileName, fileData } = body;

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
    }
    if (typeof fileData !== "string" || !ALLOWED_DATA_URL.test(fileData)) {
      return NextResponse.json(
        { error: "Archivo inválido. Solo se permiten archivos JPG, PNG o PDF (formato base64)." },
        { status: 400 }
      );
    }
    if (fileData.length > MAX_BASE64_LENGTH) {
      const isPdfData = fileData.startsWith("data:application/pdf");
      return NextResponse.json(
        {
          error: isPdfData
            ? "El PDF supera el límite de 3 MB."
            : "La imagen supera el límite permitido.",
        },
        { status: 400 }
      );
    }

    // Un solo documento pendiente por tipo
    const existing = await prisma.affiliateDocument.findFirst({
      where: { affiliateId: affiliate.id, type, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes un documento de este tipo en revisión." },
        { status: 400 }
      );
    }

    const document = await prisma.affiliateDocument.create({
      data: {
        affiliateId: affiliate.id,
        type,
        fileName: fileName ? String(fileName).slice(0, 120) : `${type}-${Date.now()}`,
        fileData,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        document: { id: document.id, type: document.type, fileName: document.fileName, status: document.status, createdAt: document.createdAt },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subiendo documento:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
