/**
 * IA para leads (Gemini flash-lite, plan gratis): puntúa 0-100, resume,
 * redacta propuesta preliminar y el primer mensaje de WhatsApp.
 * NUNCA lanza ni bloquea: si falla, el lead se guarda igual y el admin
 * simplemente no ve la intel.
 */

import { callGemini, callGeminiJson, checkAndIncrementAiQuota } from "@/lib/gemini";
import { buildServicesKnowledge } from "@/lib/chatbot";

export interface LeadIntel {
  score: number;
  summary: string;
  proposal: string;
  draftMsg: string;
}

const SYSTEM = `Eres el analista comercial de Caskiuz, un desarrollador full-stack freelance (automatización con IA, webs, apps, redes sociales automatizadas, SEO). Evalúas leads que llegan por la web.

Devuelve SOLO un JSON válido con esta forma exacta:
{"score": 0, "summary": "", "proposal": "", "draftMsg": ""}

Reglas:
- score (0-100): potencial real de venta. Alto (>70) si hay necesidad clara, presupuesto o urgencia; medio (40-70) si la idea es vaga o el presupuesto incierto; bajo (<40) si es exploración, spam o poco relacionado.
- summary: 1-2 frases para el dueño del negocio con lo esencial del lead.
- proposal: propuesta preliminar de 3-5 líneas: qué servicio o plan EXACTO del catálogo de abajo conviene (con su precio real), enfoque del trabajo y tiempo de entrega del catálogo. No inventes precios ni servicios fuera del catálogo.
- draftMsg: primer mensaje para enviarle AL CLIENTE por WhatsApp (en español, cercano y profesional, máximo 60 palabras, sin encabezados ni corchetes; saluda por su nombre, refleja su necesidad y propone el siguiente paso concreto).

${buildServicesKnowledge()}`;

export async function scoreLead(input: {
  name: string;
  email: string;
  service?: string | null;
  message: string;
  source?: string | null;
}): Promise<LeadIntel | null> {
  if (!(await checkAndIncrementAiQuota("SCORE"))) return null;

  const result = await callGeminiJson<LeadIntel>({
    system: SYSTEM,
    prompt: `Lead nuevo${input.source ? ` (canal: ${input.source})` : ""}:
Nombre: ${input.name}
Email: ${input.email}
Servicio indicado: ${input.service || "no especificado"}
Mensaje: ${input.message.slice(0, 2000)}`,
    temperature: 0.3,
    maxOutputTokens: 700,
    lite: true,
    json: true,
    timeoutMs: 15000,
  });

  if (!result.ok || !result.data) {
    if (!result.ok) console.error("scoreLead IA:", result.error);
    return null;
  }

  const d = result.data;
  const score = Math.max(0, Math.min(100, Math.round(Number(d.score) || 0)));
  const summary = typeof d.summary === "string" ? d.summary.trim().slice(0, 500) : "";
  const proposal = typeof d.proposal === "string" ? d.proposal.trim().slice(0, 2000) : "";
  const draftMsg = typeof d.draftMsg === "string" ? d.draftMsg.trim().slice(0, 800) : "";

  if (!summary && !proposal) return null;
  return { score, summary, proposal, draftMsg };
}

/**
 * Auto-respuesta personalizada para el visitante (email al instante).
 * Breve, cálido, referencia su necesidad y el servicio recomendado.
 */
export async function draftVisitorReply(input: {
  name: string;
  service?: string | null;
  message: string;
}): Promise<string | null> {
  if (!(await checkAndIncrementAiQuota("REPLY"))) return null;

  const result = await callGemini({
    system: `Eres el asistente de Caskiuz (desarrollador full-stack freelance). Escribe un email muy corto (máximo 110 palabras) respondiendo a un posible cliente que acaba de enviar el formulario de contacto de caskiuz.vercel.app. En español, cálido y profesional. Estructura: saludo con su nombre + confirmación de que su mensaje llegó + 1-2 líneas mostrando que entendiste su necesidad + qué sigue (Caskiuz le escribe en menos de 24h, o puede adelantar por WhatsApp). NO inventes precios ni compromisos. Devuelve SOLO el texto del email, sin asunto ni firmas con datos falsos; termina firmado como "Caskiuz".`,
    prompt: `Nombre del cliente: ${input.name}
Servicio indicado: ${input.service || "no especificado"}
Su mensaje: ${input.message.slice(0, 1200)}`,
    temperature: 0.6,
    maxOutputTokens: 400,
    lite: true,
    timeoutMs: 15000,
  });

  if (!result.ok) {
    console.error("draftVisitorReply IA:", result.error);
    return null;
  }
  return result.text.slice(0, 1200);
}
