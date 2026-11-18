/**
 * Eventos de analítica de cliente (GA4 + Meta Pixel si están configurados).
 * Gratis: ambos se activan por env vars y este helper es no-op sin ellos.
 */

type EventParams = Record<string, string | number | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    // GA4
    window.gtag?.("event", name, params);
    // Meta Pixel: eventos estándar equivalentes
    if (name === "contact_submit" || name === "chat_lead") {
      window.fbq?.("track", "Lead", params);
    } else if (name === "whatsapp_click") {
      window.fbq?.("track", "Contact", params);
    } else {
      window.fbq?.("trackCustom", name, params);
    }
  } catch {
    // el tracking nunca rompe la UX
  }
}
