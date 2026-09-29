"use client";

import { useEffect, useState } from "react";
import {
  SiteSessionMenu,
  SiteSessionSkeleton,
  type SiteSessionData,
} from "@/components/layout/site-session-menu";

/**
 * Píldora de sesión del top bar público. Consulta /api/session tras el
 * montaje para no volver dinámicas las páginas estáticas (blog); mientras
 * tanto muestra un esqueleto del mismo tamaño (sin saltos de layout).
 * Tras cerrar sesión, el menú vuelve a consultar el estado por aquí.
 */
export function SiteSession() {
  const [session, setSession] = useState<SiteSessionData | null>(null);

  // Consulta inicial (al montar): la píldora llega sin volver dinámicas
  // las páginas estáticas (blog).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setSession({
          affiliate: data?.affiliate ?? null,
          admin: Boolean(data?.admin),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSession({ affiliate: null, admin: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-consulta tras cerrar sesión para que la píldora cambie al instante
  async function refresh() {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const data = res.ok ? await res.json() : null;
      setSession({
        affiliate: data?.affiliate ?? null,
        admin: Boolean(data?.admin),
      });
    } catch {
      setSession({ affiliate: null, admin: false });
    }
  }

  if (!session) return <SiteSessionSkeleton />;
  return <SiteSessionMenu session={session} onSessionChange={refresh} />;
}
