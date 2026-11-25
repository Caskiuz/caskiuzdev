import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { candidateProfile } from "@/lib/candidate-profile";
import { OportunidadesClient } from "./oportunidades-client";

export const dynamic = "force-dynamic";

export default async function OportunidadesPage() {
  const opportunities = await prisma.jobOpportunity.findMany({
    orderBy: [{ status: "asc" }, { score: "desc" }, { createdAt: "desc" }],
    take: 120,
  });

  const serialized = serialize(
    opportunities.map((o) => ({
      id: o.id,
      source: o.source,
      title: o.title,
      company: o.company,
      url: o.url,
      location: o.location,
      salaryText: o.salaryText,
      score: o.score,
      matchReasons: o.matchReasons,
      draftLetter: o.draftLetter,
      status: o.status,
      appliedAt: o.appliedAt?.toISOString() ?? null,
      createdAt: o.createdAt.toISOString(),
    }))
  );

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Oportunidades <span className="gradient-text">de empleo</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Vacantes remote recolectadas cada 30 minutos de 10 fuentes gratis
          (Remotive, RemoteOK, Himalayas, Jobicy, WeWorkRemotely, Arbeitnow,
          Working Nomads, Hacker News freelance y Who is Hiring) y puntuadas por
          IA en lote contra tu perfil de{" "}
          <strong>{candidateProfile.headline.split("·")[0].trim()}</strong>.
          Aplica, genera la carta y sigue el pipeline.{" "}
          <a href="/cv" target="_blank" className="text-aff-cyan hover:underline">
            Ver tu CV público →
          </a>{" "}
          <a href="/admin/canales" className="text-aff-cyan hover:underline">
            Más canales para enviar tu CV →
          </a>
        </p>
      </div>

      <OportunidadesClient opportunities={serialized} />
    </div>
  );
}
