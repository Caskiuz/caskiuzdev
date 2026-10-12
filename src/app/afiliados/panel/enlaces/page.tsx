import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { affiliateRef } from "@/lib/affiliate";
import { platformFromSubId } from "@/lib/share-platforms";
import { LinkBuilder } from "@/components/affiliates/panel/link-builder";
import { PLATFORM_ICONS } from "@/components/affiliates/panel/social-icons";
import { SectionGuide } from "@/components/affiliates/panel/section-guide";
import { Globe } from "lucide-react";

export const dynamic = "force-dynamic";

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
          Tu link personalizado:{" "}
          <code className="px-2 py-0.5 rounded bg-surface-hover border border-border font-mono text-aff-cyan">
            /r/{affiliateRef(affiliate.slug, affiliate.referralCode)}
          </code>
          {affiliate.slug ? (
            <span className="block text-xs mt-1">
              Código alternativo: <span className="font-mono">{affiliate.referralCode}</span> · puedes
              cambiar tu link en{" "}
              <a href="/afiliados/panel/perfil" className="text-aff-cyan hover:underline">
                Perfil
              </a>
            </span>
          ) : (
            <span className="block text-xs mt-1">
              💡 Personaliza tu link con tu nombre en{" "}
              <a href="/afiliados/panel/perfil" className="text-aff-cyan hover:underline">
                Perfil
              </a>
            </span>
          )}
        </p>
      </div>

      <SectionGuide
        pageKey="enlaces"
        title="Aquí está tu dinero: todo empieza con tu link"
        intro="Tu link único es lo que te acredita cada clic y cada venta. No necesitas vender nada: solo compartirlo."
        steps={[
          "Cópialo con el botón grande de arriba.",
          "Pulsa el botón de la red donde vas a compartir: el link se copia solo.",
          "Pégalo en tu bio, estados, grupos y chats.",
          "Cada clic aparece aquí en tiempo real, y la venta queda a tu nombre.",
        ]}
        helpHref="/afiliados/panel/ayuda#tu-link"
      />

      <LinkBuilder referralCode={affiliateRef(affiliate.slug, affiliate.referralCode)} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clics recientes */}
        <div className="metal-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Clics recientes ({totalClicks.toLocaleString("en-US")} totales)</h2>
          <p className="text-xs text-muted-foreground -mt-2 mb-4">
            Los clics son visitas reales: los robots y las vistas previas de redes
            sociales no se cuentan, y los re-clics del mismo visitante en 24h no se duplican.
          </p>
          {recentClicks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay clics. ¡Comparte tu link para empezar!
            </p>
          ) : (
            <ul className="space-y-2">
              {recentClicks.map((click) => {
                const subId = click.subId?.trim() ?? "";
                const platform = platformFromSubId(subId);
                const source = !subId
                  ? click.destination === "whatsapp"
                    ? { label: "WhatsApp", icon: PLATFORM_ICONS.whatsapp }
                    : { label: "Link directo", icon: Globe }
                  : platform && subId.toLowerCase() === platform.slug
                    ? { label: platform.label, icon: PLATFORM_ICONS[platform.slug] }
                    : { label: subId, icon: platform ? PLATFORM_ICONS[platform.slug] : Globe };
                const SourceIcon = source.icon;
                return (
                  <li
                    key={click.id}
                    className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0"
                  >
                    <span className="text-muted-foreground truncate flex items-center gap-2 min-w-0">
                      <SourceIcon className="w-4 h-4 shrink-0 text-aff-cyan/70" />
                      <span className="truncate">{source.label}</span>
                      {click.convertedAt && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500">
                          Convertido
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {click.createdAt.toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Rendimiento por red social */}
        <div className="metal-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Clics por red social</h2>
          {clicksBySubId.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cuando compartas tus links por redes, aquí verás cuántos clics trae cada una.
            </p>
          ) : (
            <ul className="space-y-2">
              {clicksBySubId.map((group) => {
                const subId = group.subId?.trim() ?? "";
                const platform = platformFromSubId(subId);
                const label = !subId
                  ? "Sin red (link directo)"
                  : platform && subId.toLowerCase() === platform.slug
                    ? platform.label
                    : subId;
                const GroupIcon = platform ? PLATFORM_ICONS[platform.slug] : Globe;
                return (
                  <li
                    key={group.subId ?? "sin-subid"}
                    className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <GroupIcon className="w-4 h-4 shrink-0 text-aff-cyan/70" />
                      <span className="truncate text-foreground">{label}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {group._count._all.toLocaleString("en-US")}{" "}
                      {group._count._all === 1 ? "clic" : "clics"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
