/**
 * Redes sociales con las que el afiliado comparte su link.
 *
 * Cada red tiene su slug: viaja como `?subid=<slug>` en la URL y es lo que
 * permite agrupar los clics por red en el panel. También reconocemos los
 * sub-ID escritos a mano por los afiliados antes de este cambio (ej.
 * "instagram-julio") para que las estadísticas viejas sigan mostrando su
 * icono y su nombre.
 */

export interface SharePlatform {
  slug: string;
  label: string;
}

export const SHARE_PLATFORMS: SharePlatform[] = [
  { slug: "instagram", label: "Instagram" },
  { slug: "facebook", label: "Facebook" },
  { slug: "tiktok", label: "TikTok" },
  { slug: "whatsapp", label: "WhatsApp" },
  { slug: "telegram", label: "Telegram" },
  { slug: "youtube", label: "YouTube" },
  { slug: "twitter", label: "X (Twitter)" },
  { slug: "linkedin", label: "LinkedIn" },
];

/** Red a la que corresponde un sub-ID: exacto ("instagram") o con prefijo ("instagram-julio"). */
export function platformFromSubId(subId: string | null | undefined): SharePlatform | null {
  if (!subId) return null;
  const value = subId.trim().toLowerCase();
  if (!value) return null;

  const exact = SHARE_PLATFORMS.find((p) => p.slug === value);
  if (exact) return exact;

  return (
    SHARE_PLATFORMS.find(
      (p) => value.startsWith(`${p.slug}-`) || value.startsWith(`${p.slug}_`)
    ) ?? null
  );
}
