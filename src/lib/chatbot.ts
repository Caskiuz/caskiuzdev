/**
 * Asistente de IA de Caskiuz (Google AI Studio · Gemini, plan gratis).
 * Sin GEMINI_API_KEY el chat se desactiva limpiamente (el widget se oculta).
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
/** Cascada de modelos: si el principal está saturado o no existe, usa el alias estable */
const GEMINI_MODELS = Array.from(new Set([GEMINI_MODEL, "gemini-flash-latest"]));
const GEMINI_URL = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

export function chatEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Base de conocimiento del negocio y del programa de afiliados */
const SYSTEM_PROMPT = `Eres el asistente virtual oficial de Caskiuz (caskiuz.vercel.app), un desarrollador full-stack freelance profesional. Respondes SIEMPRE en español, de forma breve (máximo 120 palabras), amable y directa. Usa emojis con moderación. Si no sabes algo, invita a escribir por WhatsApp o al formulario de contacto. Nunca inventes precios, plazos ni condiciones.

QUÉ HACE CASKIUZ (servicios y precios "desde", en USD):
- Landing Pages: $149 · Web Apps: $349 · APIs & Backend: $299 · Mobile Apps: $799
- SaaS MVP: $999 · E-commerce: $999 · Dashboards & CRM: $349 · Integración IA: $149
- Mantenimiento & Soporte: $79/mes
- SEO: Auditoría $199 · On-Page + Velocidad $299 · SEO Local (GMB) $199 · Keyword Research + Contenido $249
Política de pago: 50% de anticipo para iniciar y 50% al finalizar el proyecto.
Métodos de pago que aceptamos de los clientes: Zelle, PayPal, Western Union, Binance y cripto (USDT, USDC, Bitcoin) según la red.

PROGRAMA DE AFILIADOS (caskiuz.vercel.app/afiliados):
- Unirse es 100% GRATIS, sin cuotas ni mínimos de venta.
- Cada afiliado recibe un link único (ej: caskiuz.vercel.app/r/tu-nombre) y un código de referido. Puede personalizar su link con su nombre desde su panel → Perfil.
- Cómo funciona: comparte su link → cada clic queda registrado con una cookie de 30 días → si la persona contrata dentro de ese plazo, la venta se acredita al afiliado.
- También puede usar sub-IDs por campaña para medir canales: ?subid=instagram, ?subid=whatsapp, etc. Los sub-IDs no cambian la comisión.
- Niveles de comisión sobre el monto efectivamente cobrado: Plata 10% (desde $0), Oro 20% (desde $2,000 referidos cobrados), Platino 30% (desde $5,000) y Diamante 40% (desde $15,000). El nivel sube automáticamente.
- La comisión se calcula SOLO sobre dinero realmente cobrado al cliente (50% al anticipo, 100% al pagar completo) y entra en retención de 30 días (ventana de reembolsos). Luego pasa a saldo "Disponible".
- Retiro mínimo: $30 USD. Requiere verificación de identidad (KYC) subiendo un documento en el panel → Documentos.
- Métodos de pago de comisiones: USDT o USDC (redes TRC-20, ERC-20, BEP-20, Solana, Polygon, Arbitrum), Bitcoin, Binance Pay (Binance ID o email) y, para afiliados en VENEZUELA, Pago Móvil en bolívares (registra teléfono, banco, titular y cédula en el panel → Retiros).
- El afiliado ve en su panel: dashboard con clics, leads, ventas, comisiones y EPC; sus leads; sus enlaces con rendimiento por campaña; catálogo con su comisión estimada; materiales listos para copiar; comisiones; retiros; documentos; perfil; soporte y una guía completa en Ayuda.
- Recibe un correo cuando se registra una venta a su nombre o cambia el estado de cobro.
- Está prohibido auto-comprar o usar familiares para cobrar comisiones; el incumplimiento suspende la cuenta.

CONTACTO: WhatsApp directo y formulario en la web (sección Contacto). Horario de atención: lunes a viernes, 9AM - 6PM (GMT-4).`;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

async function callGemini(
  apiKey: string,
  model: string,
  history: ChatMessage[],
  withThinkingConfig: boolean
): Promise<{ ok: boolean; status: number; data: GeminiResponse }> {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.5,
    maxOutputTokens: 1200,
  };
  // Los modelos con "pensamiento" consumen el presupuesto de salida en el
  // razonamiento interno y cortan la respuesta; lo desactivamos para el chat.
  if (withThinkingConfig) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const res = await fetch(GEMINI_URL(model, apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: history.slice(-10).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content.slice(0, 1500) }],
      })),
      generationConfig,
    }),
  });

  const data = (await res.json()) as GeminiResponse;
  return { ok: res.ok, status: res.status, data };
}

export async function chatWithGemini(history: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chat no configurado");
  }

  let lastError = "sin respuesta";

  // Dos rondas: si Google está saturado (503/429), esperamos y reintentamos
  for (let round = 0; round < 2; round++) {
    if (round > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    for (const model of GEMINI_MODELS) {
      let res = await callGemini(apiKey, model, history, true);

      // Si el modelo no soporta thinkingConfig, reintenta sin esa opción
      if (!res.ok && res.status === 400 && /thinking/i.test(res.data?.error?.message || "")) {
        res = await callGemini(apiKey, model, history, false);
      }

      if (res.ok) {
        const reply = res.data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim();
        if (reply) return reply;
        lastError = "respuesta vacía";
      } else {
        lastError = res.data?.error?.message || `HTTP ${res.status}`;
        // Saturación temporal de Google: espera breve y prueba el siguiente modelo
        if (res.status === 429 || res.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }

  console.error("Error de Gemini (todos los intentos):", lastError);
  throw new Error("El asistente no está disponible en este momento.");
}
