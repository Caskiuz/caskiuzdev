import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";
import { extractDocumentName } from "@/lib/kyc-ai";
import { notifyInApp } from "@/lib/notifications";

export const dynamic = "force-dynamic";
// La lectura IA del nombre corre en segundo plano tras responder (after):
// el margen cubre ese trabajo posterior sin bloquear al afiliado.
export const maxDuration = 30;

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

    // Aviso inmediato al admin: hay un documento nuevo esperando su revisión.
    // (Se envía ANTES de la lectura IA para que nunca se pierda.)
    await notifyInApp({
      recipientType: "ADMIN",
      kind: "KYC",
      title: `Documento KYC nuevo: ${affiliate.name}`,
      body: "Quedó en revisión. Ábrelo para ver el nombre leído por la IA (si pudo leerlo).",
      linkUrl: `/admin/affiliates/${affiliate.id}`,
    });

    // Lectura automática del nombre con IA EN SEGUNDO PLANO (después de
    // responder): el afiliado no espera a Gemini y la subida jamás se corta.
    // Solo LEE; la aprobación sigue siendo manual del admin.
    after(async () => {
      try {
        const info = await extractDocumentName(fileData);
        if (info?.name) {
          await prisma.affiliateDocument.update({
            where: { id: document.id },
            data: { extractedName: info.name.slice(0, 200) },
          });
        }
      } catch (error) {
        console.error("KYC: lectura IA del nombre falló:", error);
      }
    });

    return NextResponse.json(
      {
        success: true,
        document: {
          id: document.id,
          type: document.type,
          fileName: document.fileName,
          status: document.status,
          createdAt: document.createdAt,
          extractedName: null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subiendo documento:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
