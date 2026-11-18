/**
 * Meta Conversions API (CAPI) — eventos server-side para el futuro de Meta Ads.
 * Costo $0: solo envía eventos cuando hay credenciales configuradas
 * (NEXT_PUBLIC_META_PIXEL_ID + META_CAPI_TOKEN). Sin ellas, todo es no-op.
 *
 * Eventos:
 * - Lead: cuando alguien envía el formulario/wizard o deja datos por el chat
 * - Purchase: cuando una venta pasa a DEPOSIT_PAID o FULLY_PAID (admin)
 *
 * Deduplicación: event_id determinístico (el pixel del navegador y CAPI
 * comparten id cuando exista browser-side tracking).
 */

const CAPI_URL = (pixelId: string) =>
  `https://graph.facebook.com/v19.0/${pixelId}/events`;

export function metaCapiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_TOKEN);
}

interface CapiEvent {
  eventName: "Lead" | "Purchase" | "PageView";
  eventId: string;
  userData?: {
    clientIp?: string | null;
    clientUserAgent?: string | null;
    email?: string | null; // se hashea SHA-256 antes de enviar
  };
  customData?: {
    value?: number;
    currency?: string;
    content_name?: string;
    source?: string;
  };
}

/** Hash SHA-256 hex (requisito de Meta para emails en CAPI). */
async function sha256Hex(text: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

/** Envía eventos a Meta CAPI. Nunca lanza; no-op sin credenciales. */
export async function sendMetaEvent(event: CapiEvent): Promise<boolean> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return false;

  try {
    const ud = event.userData ?? {};
    const user_data: Record<string, unknown> = {};
    if (ud.clientIp) user_data.client_ip_address = ud.clientIp;
    if (ud.clientUserAgent) user_data.client_user_agent = ud.clientUserAgent;
    if (ud.email) user_data.em = await sha256Hex(ud.email);
    if (Object.keys(user_data).length === 0) user_data.client_user_agent = "caskiuz-server";

    const res = await fetch(CAPI_URL(pixelId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: event.eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: event.eventId,
            action_source: "website",
            user_data,
            custom_data: event.customData ?? {},
          },
        ],
        access_token: token,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("Meta CAPI:", res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error Meta CAPI:", error instanceof Error ? error.message : error);
    return false;
  }
}
