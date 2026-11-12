import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "./admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Guard real de las páginas del panel: exige sesión válida y cuenta activa.
  const admin = await requireAdmin();

  const [notificationsCount, prospectsCount] = await Promise.all([
    prisma.notification
      .count({
        where: { recipientType: "ADMIN", recipientId: admin.id, read: false },
      })
      .catch(() => 0),
    prisma.prospect.count({ where: { status: "NEW" } }).catch(() => 0),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        notificationsCount={notificationsCount}
        prospectsCount={prospectsCount}
        adminName={admin.name}
        adminRole={admin.role}
      />
      {/* En móvil la barra superior fija mide 64px (pt-16) y no hay margen lateral */}
      <main className="min-h-screen pt-16 lg:pt-0 lg:pl-64">{children}</main>
    </div>
  );
}
