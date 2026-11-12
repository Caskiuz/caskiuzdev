import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { ProspectosClient } from "./prospectos-client";

export const dynamic = "force-dynamic";

export default async function ProspectosPage() {
  const [prospects, cfgRows] = await Promise.all([
    prisma.prospect.findMany({
      orderBy: [{ status: "asc" }, { score: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.siteConfig.findMany({
      where: {
        key: { in: ["prospect_niches", "prospect_region", "prospect_volume", "prospect_mode"] },
      },
    }),
  ]);

  const cfg = Object.fromEntries(cfgRows.map((r) => [r.key, r.value]));

  const serialized = serialize(
    prospects.map((p) => ({
      id: p.id,
      businessName: p.businessName,
      niche: p.niche,
      region: p.region,
      contactUrl: p.contactUrl,
      siteUrl: p.siteUrl,
      why: p.why,
      angle: p.angle,
      draftMessage: p.draftMessage,
      score: p.score,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }))
  );

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Prospectos <span className="gradient-text">IA</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Cada día el cron busca negocios con Gemini + Google Search (gratis) y
          deja aquí prospectos con el mensaje de WhatsApp listo. Tú solo revisas
          y das clic. También puedes ejecutar una búsqueda manual.
        </p>
      </div>

      <ProspectosClient
        prospects={serialized}
        config={{
          prospect_niches: cfg.prospect_niches || "",
          prospect_region: cfg.prospect_region || "",
          prospect_mode: cfg.prospect_mode || "mixto",
          prospect_volume: cfg.prospect_volume || "5",
        }}
      />
    </div>
  );
}
