"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Wallet,
  Link2,
  Users,
  Megaphone,
  FileText,
  UserCircle,
  LifeBuoy,
  LogOut,
  LogIn,
  ShieldCheck,
  ShoppingCart,
  Settings,
  Loader2,
} from "lucide-react";

export interface SiteSessionData {
  affiliate: { name: string } | null;
  admin: boolean;
}

type OpenMenu = "affiliate" | "admin" | "guest" | null;

const menuItemClass =
  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SessionPill({
  dotClass,
  label,
  icon,
  open,
  busy,
  onToggle,
  children,
}: {
  dotClass: string;
  label: string;
  icon: React.ReactNode;
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-full border border-border bg-glass hover:bg-surface-hover transition-colors"
      >
        <span className={`session-dot ${dotClass}`} />
        {icon}
        <span className="text-sm font-medium hidden sm:inline max-w-[9rem] truncate">{label}</span>
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 glass-card rounded-xl border border-border p-2 z-50">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Píldora de sesión del top bar del sitio público: estado neón
 * (verde = afiliado, cian = admin, rojo = sin sesión) con accesos rápidos
 * y cierre de sesión sin salir de la página.
 */
export function SiteSessionMenu({
  session,
  onSessionChange,
}: {
  session: SiteSessionData;
  onSessionChange?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<OpenMenu>(null);
  const [busy, setBusy] = useState<OpenMenu>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function logout(kind: "affiliate" | "admin") {
    setBusy(kind);
    setOpen(null);
    try {
      await fetch(kind === "admin" ? "/api/admin/login" : "/api/affiliate/login", {
        method: "DELETE",
      });
      // Re-consulta el estado real para que la píldora cambie al instante
      onSessionChange?.();
    } finally {
      setBusy(null);
    }
    router.refresh();
  }

  const close = () => setOpen(null);

  // Sin sesión: punto rojo + accesos de ingreso
  if (!session.affiliate && !session.admin) {
    return (
      <div ref={containerRef}>
        <SessionPill
          dotClass="session-dot-off"
          label="Iniciar sesión"
          icon={<LogIn className="w-4 h-4 text-muted-foreground" />}
          open={open === "guest"}
          busy={false}
          onToggle={() => setOpen(open === "guest" ? null : "guest")}
        >
          <Link href="/afiliados/login" onClick={close} className={menuItemClass}>
            <Users className="w-4 h-4 text-aff-cyan" /> Portal de afiliados
          </Link>
          <Link href="/admin/login" onClick={close} className={menuItemClass}>
            <ShieldCheck className="w-4 h-4 text-aff-cyan" /> Panel admin
          </Link>
        </SessionPill>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      {session.affiliate && (
        <SessionPill
          dotClass="session-dot-on"
          label={`Hola, ${session.affiliate.name.split(" ")[0]}`}
          icon={
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-aff-blue-deep to-aff-sky flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {initials(session.affiliate.name)}
            </span>
          }
          open={open === "affiliate"}
          busy={busy === "affiliate"}
          onToggle={() => setOpen(open === "affiliate" ? null : "affiliate")}
        >
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-xs font-semibold truncate">{session.affiliate.name}</p>
            <p className="text-[11px] text-aff-cyan">Sesión de afiliado activa</p>
          </div>
          <Link href="/afiliados/panel" onClick={close} className={menuItemClass}>
            <LayoutDashboard className="w-4 h-4 text-aff-cyan" /> Dashboard
          </Link>
          <Link href="/afiliados/panel/comisiones" onClick={close} className={menuItemClass}>
            <Wallet className="w-4 h-4 text-aff-cyan" /> Comisiones y retiros
          </Link>
          <Link href="/afiliados/panel/enlaces" onClick={close} className={menuItemClass}>
            <Link2 className="w-4 h-4 text-aff-cyan" /> Mis enlaces
          </Link>
          <Link href="/afiliados/panel/leads" onClick={close} className={menuItemClass}>
            <Users className="w-4 h-4 text-aff-cyan" /> Mis leads
          </Link>
          <Link href="/afiliados/panel/materiales" onClick={close} className={menuItemClass}>
            <Megaphone className="w-4 h-4 text-aff-cyan" /> Materiales
          </Link>
          <Link href="/afiliados/panel/documentos" onClick={close} className={menuItemClass}>
            <FileText className="w-4 h-4 text-aff-cyan" /> Documentos
          </Link>
          <Link href="/afiliados/panel/perfil" onClick={close} className={menuItemClass}>
            <UserCircle className="w-4 h-4 text-aff-cyan" /> Perfil
          </Link>
          <Link href="/afiliados/panel/soporte" onClick={close} className={menuItemClass}>
            <LifeBuoy className="w-4 h-4 text-aff-cyan" /> Soporte
          </Link>
          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              onClick={() => logout("affiliate")}
              disabled={busy === "affiliate"}
              className={`${menuItemClass} w-full text-left text-accent hover:text-accent hover:bg-accent/10 disabled:opacity-60`}
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </SessionPill>
      )}

      {session.admin && (
        <SessionPill
          dotClass="session-dot-admin"
          label="Admin"
          icon={<ShieldCheck className="w-4 h-4 text-aff-cyan shrink-0" />}
          open={open === "admin"}
          busy={busy === "admin"}
          onToggle={() => setOpen(open === "admin" ? null : "admin")}
        >
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-xs font-semibold">Administrador</p>
            <p className="text-[11px] text-aff-cyan">Sesión de admin activa</p>
          </div>
          <Link href="/admin" onClick={close} className={menuItemClass}>
            <LayoutDashboard className="w-4 h-4 text-aff-cyan" /> Panel admin
          </Link>
          <Link href="/admin/withdrawals" onClick={close} className={menuItemClass}>
            <Wallet className="w-4 h-4 text-aff-cyan" /> Retiros
          </Link>
          <Link href="/admin/sales" onClick={close} className={menuItemClass}>
            <ShoppingCart className="w-4 h-4 text-aff-cyan" /> Ventas
          </Link>
          <Link href="/admin/affiliates" onClick={close} className={menuItemClass}>
            <Users className="w-4 h-4 text-aff-cyan" /> Afiliados
          </Link>
          <Link href="/admin/settings/payments" onClick={close} className={menuItemClass}>
            <Settings className="w-4 h-4 text-aff-cyan" /> Ajustes
          </Link>
          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              onClick={() => logout("admin")}
              disabled={busy === "admin"}
              className={`${menuItemClass} w-full text-left text-accent hover:text-accent hover:bg-accent/10 disabled:opacity-60`}
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </SessionPill>
      )}
    </div>
  );
}

/** Placeholder mientras llega el estado de sesión por streaming */
export function SiteSessionSkeleton() {
  return <div className="h-9 w-24 rounded-full border border-border bg-glass animate-pulse" />;
}
