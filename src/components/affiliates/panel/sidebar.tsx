"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Link2,
  Store,
  Megaphone,
  Coins,
  Wallet,
  FileText,
  User,
  Headphones,
  HelpCircle,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTierInfo } from "@/lib/affiliate";

const navItems = [
  { href: "/afiliados/panel", label: "Dashboard", icon: LayoutDashboard },
  { href: "/afiliados/panel/enlaces", label: "Mis enlaces", icon: Link2 },
  { href: "/afiliados/panel/catalogo", label: "Catálogo", icon: Store },
  { href: "/afiliados/panel/materiales", label: "Materiales", icon: Megaphone },
  { href: "/afiliados/panel/comisiones", label: "Comisiones", icon: Coins },
  { href: "/afiliados/panel/retiros", label: "Retiros", icon: Wallet },
  { href: "/afiliados/panel/documentos", label: "Documentos", icon: FileText },
  { href: "/afiliados/panel/perfil", label: "Perfil", icon: User },
  { href: "/afiliados/panel/soporte", label: "Soporte", icon: Headphones },
  { href: "/afiliados/panel/ayuda", label: "Ayuda", icon: HelpCircle },
];

export function PanelSidebar({
  name,
  tier,
  referralCode,
  avatarUrl,
}: {
  name: string;
  tier: string;
  referralCode: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tierInfo = getTierInfo(tier);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const avatar = (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-aff-blue-deep to-aff-sky flex items-center justify-center shrink-0 border border-glass-border">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold text-sm">{initials || "C"}</span>
      )}
    </div>
  );

  const brand = (
    <Link href="/afiliados/panel" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-aff-blue-deep to-aff-sky flex items-center justify-center">
        <span className="text-white font-bold">C</span>
      </div>
      <div>
        <p className="font-bold leading-none metal-text">Caskiuz</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Red de afiliados</p>
      </div>
    </Link>
  );

  const nav = (
    <nav className="mt-6 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive
                ? "bg-gradient-to-r from-aff-blue-deep/80 to-aff-blue/40 text-white shadow-lg shadow-aff-blue/10"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            )}
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const accountCard = (
    <div className="mt-6 metal-card rounded-xl p-3">
      <div className="flex items-center gap-3 mb-3">
        {avatar}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-[11px] text-aff-cyan truncate">
            {tierInfo.emoji} {tierInfo.name} · {Math.round(tierInfo.rate * 100)}%
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground truncate">
        Link: caskiuz.vercel.app/r/{referralCode}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Link
          href="/afiliados/panel/perfil"
          onClick={() => setOpen(false)}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Mi perfil
        </Link>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1 text-[11px] text-aff-cyan hover:underline"
        >
          Ver sitio <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-surface/60 backdrop-blur-xl p-5 z-40">
        {brand}
        {nav}
        <div className="mt-auto">
          {accountCard}
        </div>
      </aside>

      {/* Topbar móvil */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border px-4 h-16 flex items-center justify-between">
        {brand}
        <div className="flex items-center gap-2">
          <Link href="/afiliados/panel/perfil" aria-label="Mi perfil">
            {avatar}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="Toggle menú"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Drawer móvil */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -280 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed inset-y-0 left-0 w-72 z-50 bg-surface border-r border-border p-5 overflow-y-auto pt-20"
          >
            {nav}
            {accountCard}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
