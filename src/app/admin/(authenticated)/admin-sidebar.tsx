"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  Home,
  Users,
  ShoppingCart,
  Wallet,
  Megaphone,
  CreditCard,
  Send,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/messages", label: "Mensajes", icon: MessageSquare },
  { href: "/admin/notificaciones", label: "Notificaciones", icon: Bell },
];

const affiliateItems = [
  { href: "/admin/affiliates", label: "Afiliados", icon: Users },
  { href: "/admin/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/admin/withdrawals", label: "Retiros", icon: Wallet },
  { href: "/admin/anuncios", label: "Anuncios", icon: Megaphone },
];

const settingsItems = [
  { href: "/admin/settings/hero", label: "Hero", icon: Settings },
  { href: "/admin/settings/about", label: "About", icon: Settings },
  { href: "/admin/settings/services", label: "Servicios", icon: Settings },
  { href: "/admin/settings/contact", label: "Contacto", icon: Settings },
  { href: "/admin/settings/payments", label: "Métodos de pago", icon: CreditCard },
  { href: "/admin/settings/social", label: "Redes Sociales", icon: Settings },
  { href: "/admin/settings/affiliates", label: "Red de Afiliados", icon: Send },
];

export function AdminSidebar({ notificationsCount = 0 }: { notificationsCount?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Bloquea el scroll del fondo mientras el drawer está abierto
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
      active
        ? "bg-surface-hover text-foreground font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
    );

  const renderItem = (item: { href: string; label: string; icon: typeof Settings; exact?: boolean }) => {
    const showBadge = item.href === "/admin/notificaciones" && notificationsCount > 0;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={linkClass(isActive(item))}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {item.label}
        {showBadge && (
          <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold">
            {notificationsCount > 9 ? "9+" : notificationsCount}
          </span>
        )}
      </Link>
    );
  };

  const nav = (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(renderItem)}

        <div className="pt-4 pb-2">
          <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Red de Afiliados
          </span>
        </div>
        {affiliateItems.map(renderItem)}

        <div className="pt-4 pb-2">
          <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Editar Web
          </span>
        </div>
        {settingsItems.map(renderItem)}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/"
          target="_blank"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
        >
          <Home className="w-5 h-5" />
          Ver Sitio Web
        </Link>
        <LogoutButton />
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar escritorio */}
      <aside className="hidden lg:flex w-64 bg-surface border-r border-border flex-col fixed top-0 left-0 h-screen z-30">
        <div className="p-6 border-b border-border">
          <Link
            href="/admin"
            className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity"
          >
            Admin Panel
          </Link>
        </div>
        {nav}
      </aside>

      {/* Barra superior móvil */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-16 px-4 bg-surface/90 backdrop-blur-xl border-b border-border flex items-center justify-between">
        <Link href="/admin" className="text-lg font-bold gradient-text">
          Admin Panel
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Drawer móvil con fondo oscurecido (se cierra al tocar fuera) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-surface border-r border-border flex flex-col"
            >
              {/* Cabecera del drawer con su propia X (tapa la barra superior) */}
              <div className="h-16 px-4 flex items-center justify-between border-b border-border shrink-0">
                <span className="text-lg font-bold gradient-text">Admin Panel</span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
