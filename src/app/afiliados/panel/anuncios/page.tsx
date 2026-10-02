import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { SectionGuide } from "@/components/affiliates/panel/section-guide";
import { announcementKindMeta } from "@/lib/announcements";
import { Bell, Clock, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

type AnnouncementItem = {
  id: number;
  title: string;
  body: string;
  kind: string;
  linkUrl: string | null;
  linkLabel: string | null;
  startsAt: Date;
  endsAt: Date;
  reads: { id: number }[];
};

function AnnouncementCard({ announcement, unread }: { announcement: AnnouncementItem; unread: boolean }) {
  const meta = announcementKindMeta(announcement.kind);
  return (
    <article
      className={`rounded-2xl border p-5 ${
        unread ? "border-aff-blue/30 bg-aff-blue/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.badgeClass}`}
        >
          {meta.emoji} {meta.label}
        </span>
        {unread && (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-accent text-white">
            Nuevo
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          Activo hasta{" "}
          {announcement.endsAt.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <h2 className="font-bold mt-3">{announcement.title}</h2>
      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
        {announcement.body}
      </p>
      {announcement.linkUrl && (
        <a
          href={announcement.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm rounded-lg bg-aff-blue/15 text-aff-cyan border border-aff-blue/20 hover:bg-aff-blue/25 transition-colors"
        >
          <ExternalLink className="w-4 h-4" /> {announcement.linkLabel || "Ver más"}
        </a>
      )}
    </article>
  );
}

export default async function AnnouncementsPage() {
  const affiliate = await requireAffiliate();
  const now = new Date();

  const [activeAnnouncements, pastAnnouncements] = await Promise.all([
    prisma.announcement.findMany({
      where: { active: true, startsAt: { lte: now }, endsAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      include: { reads: { where: { affiliateId: affiliate.id }, select: { id: true } } },
    }),
    prisma.announcement.findMany({
      where: { OR: [{ endsAt: { lte: now } }, { active: false }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { reads: { where: { affiliateId: affiliate.id }, select: { id: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Bell className="w-7 h-7 text-aff-cyan" /> Anuncios
        </h1>
        <p className="text-muted-foreground mt-1">
          Los avisos oficiales de la red: reuniones por Zoom, clases y noticias. Los nuevos te
          aparecen al entrar al panel hasta que los leas.
        </p>
      </div>

      <SectionGuide
        pageKey="anuncios"
        title="Los avisos oficiales de la red"
        intro="Aquí llegan los comunicados de Caskiuz para todos los afiliados: fechas de clases, reuniones por Zoom con su enlace y novedades del programa."
        steps={[
          "Cuando haya un anuncio nuevo, te aparecerá al entrar al panel hasta que lo leas.",
          "Si el anuncio trae un enlace (por ejemplo, la reunión de Zoom), ábrelo desde el botón.",
          "Puedes volver a leer los anuncios activos aquí cuando quieras.",
          "Los anuncios vencidos quedan guardados en «Anuncios anteriores».",
        ]}
        helpHref="/afiliados/panel/ayuda#panel"
      />

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Anuncios activos</h2>
        {activeAnnouncements.length === 0 ? (
          <div className="metal-card rounded-2xl p-10 text-center">
            <Bell className="w-12 h-12 text-aff-cyan/50 mx-auto mb-4" />
            <p className="font-semibold mb-1">No hay anuncios activos ahora mismo</p>
            <p className="text-sm text-muted-foreground">
              Cuando publiquemos una reunión, una clase o una noticia, la verás aquí y te
              aparecerá al entrar al panel.
            </p>
          </div>
        ) : (
          activeAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              unread={announcement.reads.length === 0}
            />
          ))
        )}
      </section>

      {pastAnnouncements.length > 0 && (
        <section className="metal-card rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-aff-cyan" /> Anuncios anteriores
          </h2>
          <div className="space-y-3">
            {pastAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 rounded-xl bg-surface-hover border border-border"
              >
                <p className="text-sm font-medium">
                  {announcementKindMeta(announcement.kind).emoji} {announcement.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Venció el{" "}
                  {announcement.endsAt.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
