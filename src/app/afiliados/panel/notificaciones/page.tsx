import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { Bell } from "lucide-react";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export const dynamic = "force-dynamic";

export default async function AffiliateNotificationsPage() {
  const affiliate = await requireAffiliate();

  const notifications = await prisma.notification.findMany({
    where: { recipientType: "AFFILIATE", recipientId: affiliate.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Bell className="w-7 h-7 text-aff-cyan" /> Notificaciones
        </h1>
        <p className="text-muted-foreground mt-1">
          Leads nuevos, ventas, documentos y avisos del equipo de Caskiuz. Las no
          leídas se marcan solas al abrir esta página.
        </p>
      </div>

      <NotificationsClient
        items={serialize(
          notifications.map((n) => ({
            id: n.id,
            kind: n.kind,
            title: n.title,
            body: n.body,
            linkUrl: n.linkUrl,
            createdAt: n.createdAt.toISOString(),
            read: n.read,
          }))
        )}
        readEndpoint="/api/affiliate/notifications/read"
      />
    </div>
  );
}
