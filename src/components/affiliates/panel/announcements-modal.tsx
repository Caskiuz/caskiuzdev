"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { announcementKindMeta } from "@/lib/announcements";

export interface AnnouncementForModal {
  id: number;
  title: string;
  body: string;
  kind: string;
  linkUrl: string | null;
  linkLabel: string | null;
  endsAt: string;
}

/**
 * Modal global del panel: muestra los anuncios activos que el afiliado aún no
 * ha leído. No se puede cerrar sin pulsar "Enterado" (así el aviso llega sí o sí).
 */
export function AnnouncementsModal({ announcements }: { announcements: AnnouncementForModal[] }) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  const [gone, setGone] = useState(false);

  async function acknowledge() {
    setMarking(true);
    try {
      await fetch("/api/affiliate/announcements/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: announcements.map((a) => a.id) }),
      });
      setGone(true);
      router.refresh();
    } catch {
      setMarking(false);
    }
  }

  if (gone || announcements.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Anuncios de la red"
    >
      <div className="w-full max-w-xl max-h-[85vh] bg-surface rounded-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-border shrink-0">
          <p className="text-xs text-aff-cyan font-semibold uppercase tracking-wider">
            {announcements.length === 1
              ? "Anuncio de la red"
              : `${announcements.length} anuncios de la red`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {announcements.map((announcement) => {
            const meta = announcementKindMeta(announcement.kind);
            return (
              <article key={announcement.id} className="glass-card rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.badgeClass}`}
                  >
                    {meta.emoji} {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Disponible hasta{" "}
                    {new Date(announcement.endsAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                    })}
                  </span>
                </div>
                <h2 className="font-bold mt-3">{announcement.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
                  {announcement.body}
                </p>
                {announcement.linkUrl && (
                  <a
                    href={announcement.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm rounded-lg bg-aff-blue/15 text-aff-cyan border border-aff-blue/20 hover:bg-aff-blue/25 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> {announcement.linkLabel || "Ver más"}
                  </a>
                )}
              </article>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={acknowledge}
            disabled={marking}
            className="w-full btn-aff metal-shine px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {marking && <Loader2 className="w-4 h-4 animate-spin" />}
            Enterado
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Después podrás volver a leerlo en la sección «Anuncios» mientras siga activo.
          </p>
        </div>
      </div>
    </div>
  );
}
