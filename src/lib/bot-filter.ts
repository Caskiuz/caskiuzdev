/**
 * Detección de robots y vistas previas de redes sociales.
 *
 * Cuando un afiliado comparte su link en WhatsApp, Instagram, Facebook o
 * Telegram, esas apps visitan el link solas para generar la vista previa
 * (y los buscadores hacen lo mismo). Eso creaba clics falsos que inflaban
 * las estadísticas. Con este filtro el visitante humano redirige normal,
 * pero el robot no crea clic ni cookie.
 */

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|telegrambot|twitterbot|linkedinbot|pinterest|discordbot|slackbot|headless|puppeteer|lighthouse|curl|wget|python-requests|okhttp|httpclient|googlebot|bingbot|duckduckbot|yandex|semrush|ahrefs|petalbot|applebot|baiduspider|scrapy|monitoring|archive\.org|ia_archiver/i;

/**
 * Devuelve true si la petición viene de un robot o de la vista previa de una
 * red social (no de una persona navegando). Señales:
 * - User-Agent de crawler conocido.
 * - UA que empieza por "WhatsApp/…": es el fetcher de vista previa (el
 *   navegador interno de WhatsApp siempre empieza por "Mozilla/5.0 …").
 * - Cabeceras purpose / x-purpose: preview (Facebook, Twitter).
 * - Cabecera Accept sin text/html y sin * /*: los navegadores reales siempre
 *   piden text/html; los fetchers de vistas previas piden imágenes.
 */
export function isBotRequest(userAgent: string | null, headers: Headers): boolean {
  if (userAgent) {
    if (BOT_UA_PATTERN.test(userAgent)) return true;
    if (/^WhatsApp\//.test(userAgent)) return true;
  }

  const purpose = `${headers.get("purpose") || ""} ${headers.get("x-purpose") || ""}`.toLowerCase();
  if (purpose.includes("preview")) return true;

  const accept = headers.get("accept");
  if (
    accept &&
    !accept.toLowerCase().includes("text/html") &&
    !accept.includes("*/*")
  ) {
    return true;
  }

  return false;
}
