import type { Metadata } from "next";
import { requireAffiliate } from "@/lib/affiliate-auth";
import { affiliateRef } from "@/lib/affiliate";
import { prisma } from "@/lib/prisma/client";
import { PanelSidebar } from "@/components/affiliates/panel/sidebar";
import { LogoutButton } from "@/components/affiliates/panel/logout-button";
import { AnnouncementsModal } from "@/components/affiliates/panel/announcements-modal";

export const metadata: Metadata = {
  title: "Panel de Afiliado | Caskiuz Affiliates",
  description: "Panel del afiliado de Caskiuz: estadísticas, comisiones, enlaces y retiros.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AffiliatePanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Verifica el JWT criptográficamente y redirige si no hay sesión válida
  const affiliate = await requireAffiliate();

  // Anuncios activos que este afiliado aún no ha leído: se muestran en un modal
  // que debe confirmar con "Enterado" (en cualquier página del panel).
  const now = new Date();
  const unreadAnnouncements = await prisma.announcement.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      endsAt: { gt: now },
      reads: { none: { affiliateId: affiliate.id } },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      body: true,
      kind: true,
      linkUrl: true,
      linkLabel: true,
      endsAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <PanelSidebar
        name={affiliate.name}
        tier={affiliate.tier}
        referralCode={affiliateRef(affiliate.slug, affiliate.referralCode)}
        avatarUrl={affiliate.avatar}
        announcementsCount={unreadAnnouncements.length}
      />
      <div className="lg:pl-64">
        {/* Barra superior (solo desktop; en móvil la navegación vive en el drawer) */}
        <header className="hidden lg:block sticky top-0 z-30 border-b border-border bg-surface/70 backdrop-blur-xl">
          <div className="px-8 h-16 flex items-center justify-end">
            <LogoutButton />
          </div>
        </header>
        <main className="px-4 sm:px-8 py-8 pt-24 lg:pt-8">{children}</main>
      </div>

      <AnnouncementsModal
        announcements={unreadAnnouncements.map((announcement) => ({
          ...announcement,
          endsAt: announcement.endsAt.toISOString(),
        }))}
      />
    </div>
  );
}
