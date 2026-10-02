import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const [announcements, totalAffiliates] = await Promise.all([
    prisma.announcement.findMany({
      include: { _count: { select: { reads: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.affiliate.count(),
  ]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" /> Anuncios para afiliados
        </h1>
        <p className="text-muted-foreground mt-1">
          Publica avisos (reuniones de Zoom, noticias, recordatorios) que todos los afiliados
          verán al entrar a su panel, hasta que los lean. Cada anuncio dura el tiempo que le
          indiques y desaparece solo al vencer.
        </p>
      </div>

      <AnnouncementsManager
        announcements={serialize(
          announcements.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            kind: a.kind,
            linkUrl: a.linkUrl,
            linkLabel: a.linkLabel,
            active: a.active,
            startsAt: a.startsAt.toISOString(),
            endsAt: a.endsAt.toISOString(),
            createdAt: a.createdAt.toISOString(),
            readCount: a._count.reads,
          }))
        )}
        totalAffiliates={totalAffiliates}
      />
    </div>
  );
}
