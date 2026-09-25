import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["ID", "TAX_FORM", "CONTRACT"];
const MAX_BASE64_LENGTH = 2_800_000; // ~2MB

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
    if (typeof fileData !== "string" || !fileData.startsWith("data:")) {
      return NextResponse.json(
        { error: "Archivo inválido. Envía la imagen en formato base64 (data URL)." },
        { status: 400 }
      );
    }
    if (fileData.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: "El archivo supera el límite de 2MB." },
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
        document: { id: document.id, type: document.type, status: document.status, createdAt: document.createdAt },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subiendo documento:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
