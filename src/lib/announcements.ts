/**
 * Metadatos de los anuncios globales (admin → afiliados).
 * Módulo puro (sin imports de servidor): lo usan componentes cliente y páginas servidor.
 */

export const ANNOUNCEMENT_KINDS = {
  INFO: {
    label: "Informativo",
    emoji: "📣",
    badgeClass: "text-aff-cyan bg-aff-blue/10 border-aff-blue/20",
  },
  ZOOM: {
    label: "Reunión Zoom",
    emoji: "🎥",
    badgeClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  NEWS: {
    label: "Noticia",
    emoji: "📰",
    badgeClass: "text-green-500 bg-green-500/10 border-green-500/20",
  },
  URGENT: {
    label: "Urgente",
    emoji: "🚨",
    badgeClass: "text-accent bg-accent/10 border-accent/20",
  },
} as const;

export type AnnouncementKind = keyof typeof ANNOUNCEMENT_KINDS;

export function announcementKindMeta(kind: string) {
  return ANNOUNCEMENT_KINDS[kind as AnnouncementKind] ?? ANNOUNCEMENT_KINDS.INFO;
}

export function isAnnouncementKind(kind: unknown): kind is AnnouncementKind {
  return typeof kind === "string" && kind in ANNOUNCEMENT_KINDS;
}

export type AnnouncementStatus = "SCHEDULED" | "ACTIVE" | "EXPIRED" | "DISABLED";

/** Estado calculado de un anuncio según sus fechas y el interruptor activo. */
export function announcementStatus(
  announcement: { active: boolean; startsAt: Date | string; endsAt: Date | string },
  now: Date = new Date()
): AnnouncementStatus {
  if (!announcement.active) return "DISABLED";
  const start = new Date(announcement.startsAt).getTime();
  const end = new Date(announcement.endsAt).getTime();
  if (now.getTime() < start) return "SCHEDULED";
  if (now.getTime() >= end) return "EXPIRED";
  return "ACTIVE";
}

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  SCHEDULED: "Programado",
  ACTIVE: "Activo",
  EXPIRED: "Vencido",
  DISABLED: "Desactivado",
};

export const ANNOUNCEMENT_STATUS_CLASSES: Record<AnnouncementStatus, string> = {
  SCHEDULED: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  ACTIVE: "text-green-500 bg-green-500/10 border-green-500/20",
  EXPIRED: "text-muted-foreground bg-surface-hover border-border",
  DISABLED: "text-accent bg-accent/10 border-accent/20",
};
