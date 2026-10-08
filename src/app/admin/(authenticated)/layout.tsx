import type { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      {/* En móvil la barra superior fija mide 64px (pt-16) y no hay margen lateral */}
      <main className="min-h-screen pt-16 lg:pt-0 lg:pl-64">{children}</main>
    </div>
  );
}
