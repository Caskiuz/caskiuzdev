import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { outreachConfigured } from "@/lib/prospect-outreach";
import { ProspectosClient } from "./prospectos-client";

export const dynamic = "force-dynamic";

export default async function ProspectosPage() {
  const [prospects, cfgRows, pendingEmails] = await Promise.all([
    prisma.prospect.findMany({
      orderBy: [{ status: "asc" }, { score: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.siteConfig.findMany({
      where: {
        key: { in: ["prospect_niches", "prospect_region", "prospect_volume", "prospect_mode"] },
      },
    }),
    prisma.prospect
      .count({
        where: {
          status: "NEW",
          emailOptOut: false,
          outreachCount: 0,
          contactVerified: true,
          email: { not: null },
        },
      })
      .catch(() => 0),
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
      sourceUrl: p.sourceUrl,
      contactVerified: p.contactVerified,
      phone: p.phone,
      email: p.email,
      telegram: p.telegram,
      channel: p.channel,
      source: p.source,
      outreachCount: p.outreachCount,
      lastOutreachAt: p.lastOutreachAt?.toISOString() ?? null,
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
          Dos motores: <strong>OpenStreetMap</strong> descubre negocios reales con
          teléfono, email, Telegram o web cada 30 minutos (sin gastar cuota de IA), y{" "}
          <strong>Gemini + Google Search</strong> busca nichos específicos. Todo
          contacto pasa por sondeo real (wa.me / t.me / MX / URL viva) antes de
          aparecer aquí. Los emails verificados se envían en automático con
          «Enviar emails»; WhatsApp y Telegram se abren con un clic.
        </p>
      </div>

      <ProspectosClient
        prospects={serialized}
        emailReady={outreachConfigured()}
        pendingEmails={pendingEmails}
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
