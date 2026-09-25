import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { LinkBuilder } from "@/components/affiliates/panel/link-builder";

export default async function LinksPage() {
  const affiliate = await requireAffiliate();

  const [recentClicks, clicksBySubId] = await Promise.all([
    prisma.click.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.click.groupBy({
      by: ["subId"],
      where: { affiliateId: affiliate.id },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  const totalClicks = await prisma.click.count({ where: { affiliateId: affiliate.id } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mis enlaces</h1>
        <p className="text-muted-foreground mt-1">
          Tu código de referido:{" "}
          <code className="px-2 py-0.5 rounded bg-surface-hover border border-border font-mono text-aff-cyan">
            {affiliate.referralCode}
          </code>
        </p>
      </div>

      <LinkBuilder referralCode={affiliate.referralCode} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clics recientes */}
        <div className="metal-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Clics recientes ({totalClicks.toLocaleString("en-US")} totales)</h2>
          {recentClicks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay clics. ¡Comparte tu link para empezar!
            </p>
          ) : (
            <ul className="space-y-2">
              {recentClicks.map((click) => (
                <li
                  key={click.id}
                  className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground truncate">
                    {click.destination || "/"} {click.subId ? `· ${click.subId}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {click.createdAt.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rendimiento por campaña */}
        <div className="metal-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Clics por sub-ID de campaña</h2>
          {clicksBySubId.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crea sub-IDs (ej: &quot;facebook&quot;, &quot;youtube&quot;) para comparar tus campañas aquí.
            </p>
          ) : (
            <ul className="space-y-2">
              {clicksBySubId.map((group) => (
                <li
                  key={group.subId ?? "sin-subid"}
                  className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0"
                >
                  <span className="font-mono text-aff-cyan">
                    {group.subId || "(sin sub-ID)"}
                  </span>
                  <span className="text-muted-foreground">
                    {group._count._all.toLocaleString("en-US")} clics
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
