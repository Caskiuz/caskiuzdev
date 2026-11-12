/**
 * Asistente de IA de Caskiuz (Gemini, plan gratis) — usa el cliente compartido
 * src/lib/gemini.ts. Sin GEMINI_API_KEY el chat se desactiva limpiamente.
 *
 * El bloque de servicios/precios del system prompt se genera automáticamente
 * desde services-defaults.ts: la IA siempre cita los precios reales de la web.
 */

import { callGemini, chatEnabled } from "@/lib/gemini";
import {
  defaultServices,
  defaultMonthlyPlans,
  serviceCategories,
} from "@/lib/services-defaults";

export { chatEnabled };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Base de conocimiento de servicios generada desde el inventario real.
 *  Exportada: la reutiliza lead-ai (proposals) y el prospector. */
export function buildServicesKnowledge(): string {
  const lines: string[] = ['SERVICIOS Y PRECIOS ACTUALES DE CASKIUZ (en USD, usa EXACTAMENTE estos):'];
  for (const cat of serviceCategories) {
    const svcs = defaultServices.filter((s) => s.category === cat.key);
    const plans = cat.planGroup
      ? defaultMonthlyPlans.filter((p) => p.group === cat.planGroup)
      : [];
    if (!svcs.length && !plans.length) continue;
    lines.push("", `${cat.emoji} ${cat.label}:`);
    for (const plan of plans) {
      lines.push(`- Plan ${plan.name} (${plan.tagline}): $${plan.price}/mes`);
    }
    for (const s of svcs) {
      lines.push(
        `- ${s.title}: ${s.price}${s.deliveryTime ? ` · Entrega: ${s.deliveryTime}` : ""}`
      );
    }
  }
  return lines.join("\n");
}

/** Base de conocimiento del negocio y del programa de afiliados */
const SYSTEM_PROMPT = `Eres el asistente virtual oficial de Caskiuz (caskiuz.vercel.app), un desarrollador full-stack freelance profesional. Respondes SIEMPRE en español, de forma breve (máximo 120 palabras), amable y directa. Usa emojis con moderación. Si no sabes algo, invita a escribir por WhatsApp o al formulario de contacto. Nunca inventes precios, plazos ni condiciones: usa SOLO los de abajo.

${buildServicesKnowledge()}

Política de pago: los proyectos one-time inician con 50% de anticipo y 50% al finalizar; los planes mensuales se facturan por adelantado cada mes.
Métodos de pago que aceptamos de los clientes: Zelle, PayPal, Western Union, Binance y cripto (USDT, USDC, Bitcoin) según la red. Los datos exactos de cada cuenta NO son públicos (por privacidad): se comparten al confirmar el proyecto y están disponibles para los afiliados en su panel → Catálogo.

GUÍA DE COTIZACIÓN (ayuda a convertir):
- Si el visitante pide una cotización o no sabe qué necesita, hazle 1-2 preguntas cortas (¿para qué negocio es? ¿qué quiere automatizar?) y luego recomienda UN servicio o plan concreto con su precio exacto y explica en 2 líneas por qué.
- Si muestra interés, invítalo a dejar sus datos en el formulario del chat ("Quiero una cotización") para que Caskiuz lo contacte, o a escribir por WhatsApp.

PROGRAMA DE AFILIADOS (caskiuz.vercel.app/afiliados):
- Unirse es 100% GRATIS, sin cuotas ni mínimos de venta.
- Cada afiliado recibe un link único (ej: caskiuz.vercel.app/r/tu-nombre) y un código de referido. Puede personalizar su link con su nombre desde su panel → Perfil. Con ese solo link queda cubierto todo: si el visitante llena el formulario se registra automático, y si escribe por los botones de WhatsApp de la web (o por este chat), el código de referido viaja solo en el mensaje. Su link siempre lleva a la página principal de Caskiuz.
- Cómo funciona: comparte su link → cada clic queda registrado con una cookie de 30 días → si la persona contrata dentro de ese plazo, la venta se acredita al afiliado.
- Niveles de comisión sobre el monto efectivamente cobrado: Plata 10% (desde $0), Oro 20% (desde $2,000 referidos cobrados), Platino 30% (desde $5,000) y Diamante 40% (desde $15,000). El nivel sube automáticamente.
- La comisión se calcula SOLO sobre dinero realmente cobrado al cliente y queda DISPONIBLE DE INMEDIATO. Retiro mínimo: $15 USD, requiere KYC (documento en el panel → Documentos).
- Métodos de pago de comisiones: USDT/USDC (TRC-20, ERC-20, BEP-20, Solana, Polygon, Arbitrum), Bitcoin, Binance Pay y PayPal; y según el país: Pago Móvil (Venezuela), Nequi/Bancolombia/Daviplata (Colombia), Yape (Perú), Zelle (USA).
- Está prohibido auto-comprar o usar familiares para cobrar comisiones; el incumplimiento suspende la cuenta.

CONTACTO: WhatsApp directo y formulario en la web (sección Contacto). Horario de atención: lunes a viernes, 9AM - 6PM (GMT-4).`;

export async function chatWithGemini(history: ChatMessage[]): Promise<string> {
  const contents = history.slice(-10).map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    text: m.content.slice(0, 1500),
  }));

  const result = await callGemini({
    contents,
    system: SYSTEM_PROMPT,
    temperature: 0.5,
    maxOutputTokens: 1200,
    timeoutMs: 25000,
  });

  if (!result.ok) {
    console.error("Error de Gemini (todos los intentos):", result.error);
    throw new Error("El asistente no está disponible en este momento.");
  }
  return result.text;
}
