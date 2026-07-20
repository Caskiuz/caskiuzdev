import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  LogOut,
  Home,
} from "lucide-react";
import { LogoutButton } from "./logout-button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col fixed top-0 left-0 h-screen z-30">
        <div className="p-6 border-b border-border">
          <Link
            href="/admin"
            className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity"
          >
            Admin Panel
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarLink
            href="/admin"
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <SidebarLink
            href="/admin/messages"
            icon={<MessageSquare className="w-5 h-5" />}
            label="Mensajes"
          />

          <div className="pt-4 pb-2">
            <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Editar Web
            </span>
          </div>

          <SidebarLink
            href="/admin/settings/hero"
            icon={<Settings className="w-5 h-5" />}
            label="Hero"
          />
          <SidebarLink
            href="/admin/settings/about"
            icon={<Settings className="w-5 h-5" />}
            label="About"
          />
          <SidebarLink
            href="/admin/settings/services"
            icon={<Settings className="w-5 h-5" />}
            label="Servicios"
          />
          <SidebarLink
            href="/admin/settings/contact"
            icon={<Settings className="w-5 h-5" />}
            label="Contacto"
          />
          <SidebarLink
            href="/admin/settings/social"
            icon={<Settings className="w-5 h-5" />}
            label="Redes Sociales"
          />
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Ver Sitio Web
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}