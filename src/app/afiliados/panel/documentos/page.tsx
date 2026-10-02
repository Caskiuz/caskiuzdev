import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { DocumentsClient } from "@/components/affiliates/panel/documents-client";
import { SectionGuide } from "@/components/affiliates/panel/section-guide";

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
          Verifica tu identidad para habilitar los retiros. El contrato y los términos los
          aceptaste al crear tu cuenta.
        </p>
      </div>
      <SectionGuide
        pageKey="documentos"
        title="Tu identidad desbloquea los retiros"
        intro="Un solo requisito documental: una foto clara de tu cédula, pasaporte o DNI. Se usa únicamente para verificación."
        steps={[
          "Sube una foto clara del documento (ambas caras en un archivo si puedes).",
          "El equipo lo revisa y aprueba en un máximo de 72 horas.",
          "Con el estado «Aprobado» ya puedes solicitar tus retiros.",
        ]}
        helpHref="/afiliados/panel/ayuda#documentos"
      />
      <DocumentsClient initialDocuments={initialDocuments} />
    </div>
  );
}
