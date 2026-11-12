/**
 * Prospección automática 100% gratis: Gemini + Google Search grounding
 * (cuota gratuita del plan de Gemini API).
 *
 * Cada ronda busca negocios reales según los nichos configurados en el admin
 * (SiteConfig) y deja prospectos con mensaje WhatsApp listo — el humano solo
 * revisa y da clic. Modo "mixto": rota entre sin-web y sin-automatización
 * según el día del mes.
 *
 * Nichos/config (SiteConfig):
 * - prospect_niches  → "restaurantes, clínicas dentales, gimnasios..."
 * - prospect_region  → "Venezuela, Colombia, Perú..."
 * - prospect_mode    → "mixto" | "no-web" | "sin-automatizacion"
 * - prospect_volume  → prospectos por ronda (default 5, máx 10)
 */

import { prisma } from "@/lib/prisma/client";
import { callGemini, extractJson, checkAndIncrementAiQuota } from "@/lib/gemini";

interface ProspectCandidate {
  businessName?: string;
  niche?: string;
  region?: string;
  contactUrl?: string;
  siteUrl?: string;
  why?: string;
  angle?: string;
  draftMessage?: string;
  score?: number;
}

export interface ProspectingResult {
  inserted: number;
  found: number;
  mode: string;
  niches: string;
  region: string;
  error?: string;
}

const SYSTEM = `Eres un prospector comercial experto que trabaja para Caskiuz, un freelance que vende: webs y landing pages, automatización empresarial con IA (chatbots WhatsApp/Instagram, workflows n8n), redes sociales automatizadas, agentes de voz, scraping y dashboards.

Tu trabajo: usar Google Search (tienes la herramienta de búsqueda activa) para encontrar negocios REALES y ACTIVOS que encajen con el perfil pedido HOY. Prioriza negocios pequeños/medianos con señales de actividad reciente (redes sociales activas, reseñas, anuncios recientes).

Devuelve SOLO un JSON válido: {"prospects": [{"businessName": "", "niche": "", "region": "", "contactUrl": "", "siteUrl": "", "why": "", "angle": "", "draftMessage": "", "score": 0}]}

Reglas estrictas:
- businessName: nombre real del negocio encontrado (nunca inventado ni genérico).
- contactUrl: link wa.me/… con el teléfono público del negocio si lo encuentras (formato https://wa.me/NUMEROPAISNUMERO); si no hay WhatsApp público, su link de contacto o Instagram; null si nada.
- siteUrl: su web actual si tiene (para el perfil "sin web" deja null y explícalo en why).
- why: 1-2 líneas con la EVIDENCIA de por qué es buen prospecto (qué encontraste).
- angle: el servicio de Caskiuz que encaja + el gancho de venta en 1-2 líneas.
- draftMessage: mensaje de WhatsApp EN ESPAÑOL listo para enviar al negocio: máximo 70 palabras, cercano y profesional, menciona algo específico y verdadero de su negocio (nunca inventes detalles), presenta el beneficio concreto y cierra con una pregunta suave. Sin enlaces, sin corchetes, sin firmas.
- score 0-100: calidad del prospecto (actividad + necesidad clara + contacto posible).
- Los negocios deben ser distintos entre sí y de nichos/regiones pedidos.`;

/** Perfiles de búsqueda del modo mixto (rota por día del mes). */
const MODE_PROFILES: Record<string, string> = {
  "no-web":
    "negocios reales y activos que NO tienen página web (o tienen una web rota, sin dominio propio o muy anticuada). El gancho: una web profesional les trae clientes y les da credibilidad.",
  "sin-automatizacion":
    "negocios reales y MUY activos en Instagram/WhatsApp que no tienen chatbot, ni respuestas automáticas, ni automatización visible. El gancho: no pierden ventas por responder tarde y automatizan pedidos/citas con IA.",
};

export async function runProspecting(overrides?: {
  niches?: string;
  region?: string;
  volume?: number;
  mode?: string;
}): Promise<ProspectingResult> {
  // Config desde la DB (editable en el admin) con defaults razonables
  const cfgRows = await prisma.siteConfig.findMany({
    where: {
      key: { in: ["prospect_niches", "prospect_region", "prospect_volume", "prospect_mode"] },
    },
  });
  const cfg = Object.fromEntries(cfgRows.map((r) => [r.key, r.value]));

  const niches = (overrides?.niches || cfg.prospect_niches ||
    "restaurantes, clínicas dentales, veterinarias, gimnasios, tiendas de ropa, ferreterías, salones de belleza").slice(0, 400);
  const region = (overrides?.region || cfg.prospect_region ||
    "Venezuela, Colombia, Perú, México y Ecuador").slice(0, 200);
  const volume = Math.min(Math.max(overrides?.volume || Number(cfg.prospect_volume) || 5, 3), 10);

  const modeConfig = overrides?.mode || cfg.prospect_mode || "mixto";
  const dayNum = new Date().getDate();
  const mode =
    modeConfig === "mixto" ? (dayNum % 2 === 0 ? "no-web" : "sin-automatizacion") : modeConfig;
  const profile =
    MODE_PROFILES[mode] ||
    "negocios reales y activos que podrían mejorar sus ventas con una web o automatización con IA.";

  const quota = await checkAndIncrementAiQuota("PROSPECT");
  if (!quota) {
    return { inserted: 0, found: 0, mode, niches, region, error: "Cuota diaria de prospección agotada" };
  }

  // Grounding NO admite responseMimeType JSON: se pide JSON en el prompt y se
  // parsea con extractJson (tolerante a fences y texto alrededor).
  const result = await callGemini({
    system: SYSTEM,
    prompt: `Busca HOY ${volume} prospectos: ${profile}
Nichos objetivo: ${niches}
Región objetivo: ${region}
Fecha: ${new Date().toISOString().slice(0, 10)}

IMPORTANTE: responde ÚNICAMENTE con el JSON pedido en tus instrucciones (sin markdown ni explicaciones).`,
    temperature: 0.4,
    maxOutputTokens: 3000,
    grounding: true,
    timeoutMs: 50000,
  });

  if (!result.ok) {
    return {
      inserted: 0,
      found: 0,
      mode,
      niches,
      region,
      error: result.error || "La IA no respondió",
    };
  }

  const data = extractJson<{ prospects?: ProspectCandidate[] }>(result.text);
  if (!data?.prospects?.length) {
    return {
      inserted: 0,
      found: 0,
      mode,
      niches,
      region,
      error: "La IA no devolvió prospectos en el formato esperado",
    };
  }

  // Dedupe contra prospectos existentes (por nombre normalizado)
  const existing = await prisma.prospect.findMany({
    select: { businessName: true },
  });
  const existingKeys = new Set(
    existing.map((p) => p.businessName.toLowerCase().replace(/\s+/g, " ").trim())
  );

  const candidates = data.prospects
    .filter((p) => p.businessName && p.draftMessage)
    .filter((p) => {
      const key = p.businessName!.toLowerCase().replace(/\s+/g, " ").trim();
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    })
    .slice(0, volume);

  if (!candidates.length) {
    return { inserted: 0, found: data.prospects.length, mode, niches, region };
  }

  const created = await prisma.prospect.createMany({
    data: candidates.map((p) => ({
      businessName: p.businessName!.slice(0, 200),
      niche: (p.niche || "").slice(0, 120),
      region: (p.region || region).slice(0, 120),
      contactUrl: p.contactUrl ? p.contactUrl.slice(0, 500) : null,
      siteUrl: p.siteUrl ? p.siteUrl.slice(0, 500) : null,
      why: (p.why || "").slice(0, 2000),
      angle: (p.angle || "").slice(0, 2000),
      draftMessage: p.draftMessage!.slice(0, 2000),
      score: Math.max(0, Math.min(100, Math.round(Number(p.score) || 0))),
      status: "NEW",
    })),
  });

  return {
    inserted: created.count,
    found: data.prospects.length,
    mode,
    niches,
    region,
  };
}
