/**
 * Prospección automática 100% gratis: Gemini + Google Search grounding
 * (cuota gratuita del plan de Gemini API) + VERIFICACIÓN de contactos.
 *
 * La IA alucina números de WhatsApp y URLs muertas aunque busque en Google;
 * por eso NADA llega a la base sin comprobar:
 *   1. Los números se extraen del HTML de las páginas fuente REALES (las que
 *      Google devolvió en el grounding) y se sondean en wa.me — que renderiza
 *      server-side el nombre de la cuenta si el número existe.
 *   2. El nombre de la cuenta de WhatsApp se cruza contra el nombre del
 *      negocio (si no coinciden, el número es de otro: se descarta).
 *   3. Toda URL (site/contacto) se comprueba viva (HTTP < 400).
 *   4. Un prospecto sin NINGÚN canal de contacto verificado no se guarda.
 *
 * Nichos/config (SiteConfig):
 * - prospect_niches  → "restaurantes, clínicas dentales, gimnasios..."
 * - prospect_region  → "Venezuela, Colombia, Perú..."
 * - prospect_mode    → "mixto" | "no-web" | "sin-automatizacion"
 * - prospect_volume  → prospectos por ronda (default 5, máx 10)
 */

import { prisma } from "@/lib/prisma/client";
import {
  callGemini,
  extractJson,
  checkAndIncrementAiQuota,
  getAiUsageToday,
} from "@/lib/gemini";
import {
  verifyWhatsAppNumber,
  fetchAndExtractContacts,
  isUrlAlive,
  nameMatches,
  type ExtractedContacts,
} from "@/lib/contact-verifier";

interface ProspectCandidate {
  businessName?: string;
  niche?: string;
  region?: string;
  contactUrl?: string;
  siteUrl?: string;
  sourceUrl?: string;
  why?: string;
  angle?: string;
  draftMessage?: string;
  score?: number;
}

export interface ProspectingResult {
  inserted: number;
  found: number;
  discardedNoContact: number;
  mode: string;
  niches: string;
  region: string;
  error?: string;
}

const SYSTEM = `Eres un prospector comercial experto que trabaja para Caskiuz, un freelance que vende: webs y landing pages, automatización empresarial con IA (chatbots WhatsApp/Instagram, workflows n8n), redes sociales automatizadas, agentes de voz, scraping y dashboards.

Tu trabajo: usar Google Search (tienes la herramienta de búsqueda activa) para encontrar negocios REALES y ACTIVOS que encajen con el perfil pedido HOY. Prioriza negocios pequeños/medianos con señales de actividad reciente (redes sociales activas, reseñas, anuncios recientes).

Devuelve SOLO un JSON válido: {"prospects": [{"businessName": "", "niche": "", "region": "", "contactUrl": "", "siteUrl": "", "sourceUrl": "", "why": "", "angle": "", "draftMessage": "", "score": 0}]}

Reglas estrictas — ANTI-INVENCIÓN (lo verificamos después y lo inventado se descarta):
- businessName: nombre real del negocio VISTO en los resultados de búsqueda (nunca inventado ni genérico).
- sourceUrl: la URL EXACTA de una de las fuentes de búsqueda donde viste el negocio (una de las páginas que Google devolvió). Obligatoria.
- contactUrl: SOLO un link wa.me/… o URL de contacto que hayas VISTO literalmente en una página del negocio o en los resultados. Si no lo viste, null. NUNCA construyas ni adivines números de teléfono.
- siteUrl: su web actual SOLO si viste el dominio en los resultados; null si no (y en el perfil "sin web" siempre null).
- why: 1-2 líneas con la EVIDENCIA de por qué es buen prospecto (qué encontraste y en qué fuente).
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

interface VerifiedProspect {
  businessName: string;
  niche: string;
  region: string;
  contactUrl: string | null;
  siteUrl: string | null;
  sourceUrl: string | null;
  contactVerified: boolean;
  why: string;
  angle: string;
  draftMessage: string;
  score: number;
}

/**
 * Verifica y enriquece un candidato: extrae números de WhatsApp reales de sus
 * páginas, los sondea en wa.me y comprueba que las URLs estén vivas.
 * Devuelve null si no queda NINGÚN canal de contacto verificado.
 */
async function verifyCandidate(
  cand: ProspectCandidate,
  fallbackSources: string[]
): Promise<VerifiedProspect | null> {
  const businessName = (cand.businessName || "").trim().slice(0, 200);
  if (!businessName) return null;

  // URLs donde buscar contactos: la fuente citada por la IA y su sitio; si no
  // hay ninguna, páginas de la pool de fuentes reales de Google (grounding).
  const scrapeUrls: string[] = [];
  for (const u of [cand.sourceUrl, cand.siteUrl]) {
    if (u && /^https?:\/\//.test(u) && !scrapeUrls.includes(u)) scrapeUrls.push(u);
  }
  for (const u of fallbackSources) {
    if (scrapeUrls.length >= 2) break;
    if (!scrapeUrls.includes(u)) scrapeUrls.push(u);
  }

  // 1) Extraer contactos reales de las páginas fuente (máx 2 por candidato)
  const scrapeTargets = scrapeUrls.slice(0, 2);
  const pageResults = await Promise.allSettled(
    scrapeTargets.map((u) => fetchAndExtractContacts(u))
  );
  const extractions: { contacts: ExtractedContacts; sourceUrl: string }[] = [];
  for (let i = 0; i < pageResults.length; i++) {
    const r = pageResults[i];
    if (r.status === "fulfilled" && r.value) {
      extractions.push({ contacts: r.value, sourceUrl: scrapeTargets[i] });
    }
  }

  // 2) Candidatos a número: el que citó la IA + los extraídos del HTML real
  const numbersToProbe: string[] = [];
  const waMatch = cand.contactUrl?.match(/wa\.me\/(\d{8,15})/) ||
    cand.contactUrl?.match(/phone=(\d{8,15})/);
  if (waMatch) numbersToProbe.push(waMatch[1]);
  for (const ext of extractions) {
    for (const n of ext.contacts.whatsappNumbers) {
      if (!numbersToProbe.includes(n) && numbersToProbe.length < 4) numbersToProbe.push(n);
    }
  }

  // 3) Sondear números en wa.me y quedarse con el primero REAL que además
  //    corresponda al negocio (el og:title de la cuenta debe coincidir).
  let verifiedWa: string | null = null;
  let contactSource: string | null = null;
  if (numbersToProbe.length) {
    const probes = await Promise.allSettled(numbersToProbe.map((n) => verifyWhatsAppNumber(n)));
    for (let i = 0; i < probes.length; i++) {
      const p = probes[i];
      if (p.status !== "fulfilled" || !p.value.exists) continue;
      if (!nameMatches(businessName, p.value.profileName)) continue; // número de otro negocio
      verifiedWa = `https://wa.me/${numbersToProbe[i]}`;
      contactSource =
        extractions.find((e) => e.contacts.whatsappNumbers.includes(numbersToProbe[i]))
          ?.sourceUrl ??
        cand.sourceUrl ??
        scrapeUrls[0] ??
        null;
      break;
    }
  }

  // 4) URLs: comprobar vivas; las muertas NO se guardan (el bug que reportó el usuario).
  //    Los wa.me no se "verifican" aquí: ya pasaron el sondeo real de arriba.
  const plainUrls = [cand.contactUrl, cand.siteUrl].filter(
    (u): u is string => Boolean(u) && /^https?:\/\//.test(u!) && !u!.includes("wa.me/")
  );
  const urlChecks = await Promise.allSettled(
    plainUrls.map((u) => isUrlAlive(u).then((alive) => ({ url: u, alive })))
  );
  const aliveOf = (url?: string | null) => {
    if (!url) return false;
    const hit = urlChecks.find(
      (c) => c.status === "fulfilled" && c.value.url === url
    ) as PromiseFulfilledResult<{ url: string; alive: boolean }> | undefined;
    return hit?.value.alive ?? false;
  };

  const aliveContactUrl = !verifiedWa && aliveOf(cand.contactUrl) ? cand.contactUrl!.slice(0, 500) : null;
  const aliveSiteUrl = aliveOf(cand.siteUrl) ? cand.siteUrl!.slice(0, 500) : null;

  // 5) Regla de oro: sin ningún canal verificado → fuera
  const contactVerified = Boolean(verifiedWa || aliveContactUrl || aliveSiteUrl);
  if (!contactVerified) return null;

  return {
    businessName,
    niche: (cand.niche || "").slice(0, 120),
    region: (cand.region || "").slice(0, 120),
    contactUrl: verifiedWa ?? aliveContactUrl,
    siteUrl: aliveSiteUrl,
    sourceUrl: (contactSource || cand.sourceUrl || scrapeUrls[0] || null)?.slice(0, 500) ?? null,
    contactVerified: Boolean(verifiedWa),
    why: (cand.why || "").slice(0, 2000),
    angle: (cand.angle || "").slice(0, 2000),
    draftMessage: (cand.draftMessage || "").slice(0, 2000),
    score: Math.max(0, Math.min(100, Math.round(Number(cand.score) || 0))),
  };
}

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

  // Pre-vuelo SIN cobrar cuota: el contador interno solo se incrementa cuando
  // la ronda termina en éxito (antes, los intentos fallidos de Gemini quemaban
  // los 3 slots del día sin producir prospectos).
  const usedToday = await getAiUsageToday("PROSPECT");
  if (usedToday >= 3) {
    return {
      inserted: 0,
      found: 0,
      discardedNoContact: 0,
      mode,
      niches,
      region,
      error: "Cuota diaria de prospección agotada (3 rondas exitosas/día)",
    };
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
      discardedNoContact: 0,
      mode,
      niches,
      region,
      error: result.error || "La IA no respondió",
    };
  }

  // La ronda de búsqueda terminó OK: ahora sí consume el slot diario interno
  await checkAndIncrementAiQuota("PROSPECT");

  const data = extractJson<{ prospects?: ProspectCandidate[] }>(result.text);
  if (!data?.prospects?.length) {
    return {
      inserted: 0,
      found: 0,
      discardedNoContact: 0,
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
    });

  // Verificación en paralelo: solo sobreviven prospectos con contacto REAL
  const verified = await Promise.all(candidates.map((c) => verifyCandidate(c, result.sources ?? [])));
  const keep = verified.filter((v): v is VerifiedProspect => v !== null);

  // Insertar solo los verificados (máx `volume` por ronda)
  const toInsert = keep.slice(0, volume);

  if (toInsert.length) {
    await prisma.prospect.createMany({ data: toInsert.map((p) => ({ ...p, status: "NEW" })) });
  }

  return {
    inserted: toInsert.length,
    found: data.prospects.length,
    discardedNoContact: data.prospects.length - toInsert.length,
    mode,
    niches,
    region,
  };
}
