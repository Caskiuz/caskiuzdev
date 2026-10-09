import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma/client";
import { AdminSidebar } from "./admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const notificationsCount = await prisma.notification
    .count({ where: { recipientType: "ADMIN", read: false } })
    .catch(() => 0);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar notificationsCount={notificationsCount} />
      {/* En móvil la barra superior fija mide 64px (pt-16) y no hay margen lateral */}
      <main className="min-h-screen pt-16 lg:pt-0 lg:pl-64">{children}</main>
    </div>
  );
}
