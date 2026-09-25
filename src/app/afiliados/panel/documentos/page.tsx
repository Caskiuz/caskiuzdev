import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { DocumentsClient } from "@/components/affiliates/panel/documents-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const affiliate = await requireAffiliate();

  const documents = await prisma.affiliateDocument.findMany({
    where: { affiliateId: affiliate.id },
    select: { id: true, type: true, fileName: true, status: true, notes: true, createdAt: true, reviewedAt: true },
    orderBy: { createdAt: "desc" },
  });

  const initialDocuments = serialize(
    documents.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      reviewedAt: d.reviewedAt?.toISOString() ?? null,
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Verificación de identidad, formularios fiscales y contrato. Requisito para retirar.
        </p>
      </div>
      <DocumentsClient initialDocuments={initialDocuments} />
    </div>
  );
}
