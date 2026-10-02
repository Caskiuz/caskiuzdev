import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

/**
 * Devuelve el contenido del documento SOLO a su dueño (para la vista previa
 * de imágenes y PDFs). Ningún afiliado puede ver documentos ajenos.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const documentId = Number(id);
  if (!Number.isInteger(documentId)) {
    return NextResponse.json({ error: "Documento inválido." }, { status: 400 });
  }

  const document = await prisma.affiliateDocument.findFirst({
    where: { id: documentId, affiliateId: affiliate.id },
    select: { id: true, fileName: true, fileData: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ fileName: document.fileName, fileData: document.fileData });
}
