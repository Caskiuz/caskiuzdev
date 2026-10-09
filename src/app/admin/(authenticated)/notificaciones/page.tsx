import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { Bell } from "lucide-react";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    where: { recipientType: "ADMIN" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Notificaciones
        </h1>
        <p className="text-muted-foreground mt-1">
          Avisos del sistema: leads nuevos, ventas, documentos y retiros. Las no
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
        readEndpoint="/api/admin/notifications/read"
      />
    </div>
  );
}
