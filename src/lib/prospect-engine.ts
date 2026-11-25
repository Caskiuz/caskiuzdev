/**
 * Motor de prospección masiva 100% gratis.
 *
 * Diferencia clave con prospector.ts (IA + Google Search): aquí el
 * DESCUBRIMIENTO no usa IA ni cuotas — sale de OpenStreetMap (Overpass), que
 * devuelve cientos de negocios con teléfono/email/web en segundos. La IA solo
 * se usa, opcionalmente, para mejorar el mensaje de los mejores prospectos en
 * UNA llamada por lote (no una por prospecto).
 *
 * Pipeline:
 *   OSM → ranking por canales → dedupe contra la DB → verificación real
 *   (wa.me / t.me / MX / URL viva) → inserción → enriquecido IA opcional.
 *
 * Nada entra sin verificar: si un negocio no tiene WhatsApp, Telegram, email
 * con MX ni web viva, se descarta. Así el panel solo muestra contactos que
 * existen de verdad.
 */

import { prisma } from "@/lib/prisma/client";
import { callAI } from "@/lib/ai-router";
import { checkAndIncrementAiQuota, extractJson, getAiUsageToday } from "@/lib/gemini";
import {
  fetchAndExtractContacts,
  isLikelyMobile,
  isUrlAlive,
  nameMatches,
  normalizePhone,
  verifyEmailDeliverable,
  verifyTelegramHandle,
  verifyWhatsAppNumber,
} from "@/lib/contact-verifier";
import { fetchOsmCities, pickCities, type OsmBusiness, type OsmCity } from "@/lib/prospect-sources";

type Channel = "WHATSAPP" | "TELEGRAM" | "EMAIL" | "WEB";

export interface OsmProspectingStats {
  found: number;
  candidates: number;
  verified: number;
  inserted: number;
  discarded: number;
  duplicated: number;
  channels: Record<Channel, number>;
  cities: string[];
  aiUpgraded: number;
  elapsedMs: number;
  error?: string;
}

const HOT_NICHES = /restaurant|comida|cafeter|panader|dental|odont|veterinar|gimnasio|fitness|belleza|peluquer|ropa|hotel|posada|inmobiliaria|viajes|farmacia/i;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ejecuta `fn` sobre `items` con concurrencia máxima. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Score por reglas (sin IA): cuantos más canales reales, mejor prospecto. */
function ruleScore(b: OsmBusiness): number {
  let score = 45;
  if (b.whatsappNumbers.length) score += 14;
  if (b.phones.some((p) => isLikelyMobile(p, b.country))) score += 10;
  if (b.emails.length) score += 10;
  if (b.telegrams.length) score += 10;
  if (b.websites.length) score += 7;
  if (b.instagrams.length) score += 3;
  if (b.address) score += 2;
  if (HOT_NICHES.test(`${b.niche} ${b.name}`)) score += 4;
  return Math.max(0, Math.min(95, score));
}

function templateMessage(b: OsmBusiness, channel: Channel, hasSite: boolean): string {
  const city = b.city || b.region;
  const hook = hasSite
    ? "Vi su web y creo que pueden convertir más visitas en clientes"
    : `Los encontré en el mapa público de ${city} y no vi una web activa en su ficha`;
  const offer = hasSite
    ? "un chatbot de WhatsApp con IA que responda y agende citas solo"
    : "una web rápida y moderna que reciba pedidos por WhatsApp";
  if (channel === "EMAIL") {
    return `Hola, equipo de ${b.name}:\n\n${hook}. Soy Ricardo Agelvis (Caskiuz), desarrollador full-stack. Ayudo a negocios como el suyo a vender más con ${offer}.\n\nTengo un plan claro y sin complicaciones para un negocio como el suyo en ${city}. ¿Le interesa que le comparta una propuesta breve?\n\nSaludos,\nRicardo — caskiuz.vercel.app`;
  }
  return `Hola, equipo de ${b.name} 👋 Soy Ricardo, desarrollador full-stack. ${hook}. Puedo montarles ${offer} en pocos días. ¿Les gustaría ver una idea concreta sin compromiso?`;
}

function buildWhy(b: OsmBusiness, channel: Channel, hasSite: boolean): string {
  const evidence: Record<Channel, string> = {
    WHATSAPP: "número con WhatsApp verificado por sondeo real",
    TELEGRAM: "usuario de Telegram verificado en su ficha pública",
    EMAIL: "email con dominio y registros MX válidos",
    WEB: "web activa comprobada (HTTP OK)",
  };
  const site = hasSite ? "tiene web activa" : "no tiene web propia";
  return `${b.niche} en ${b.city} con ${evidence[channel]}; ${site}. Datos públicos de OpenStreetMap (${b.address || "sin dirección"}).`;
}

function buildAngle(hasSite: boolean): string {
  return hasSite
    ? "Automatización de WhatsApp/citas con IA + optimización de conversión de su web actual."
    : "Landing page profesional con catálogo y botón de WhatsApp; presencia digital que genera pedidos.";
}

interface VerifiedBusiness {
  data: {
    businessName: string;
    niche: string;
    region: string;
    contactUrl: string;
    siteUrl: string | null;
    sourceUrl: string;
    contactVerified: boolean;
    phone: string | null;
    email: string | null;
    telegram: string | null;
    channel: Channel;
    source: "OSM";
    externalId: string;
    why: string;
    angle: string;
    draftMessage: string;
    score: number;
    status: string;
  };
  channel: Channel;
}

/**
 * Verifica un negocio OSM: intenta WhatsApp (explícito + móviles), Telegram,
 * email con MX y por último web viva. También cosecha contactos de su web.
 */
async function verifyBusiness(
  b: OsmBusiness,
  scrapeBudget: { left: number }
): Promise<VerifiedBusiness | null> {
  const site = b.websites[0] || null;
  let siteAlive = false;
  const waNumbers = new Set(b.whatsappNumbers.map(normalizePhone).filter(Boolean));
  const emails = new Set(b.emails);
  const telegrams = new Set(b.telegrams);

  // 1) Cosecha de la web del negocio (solo si aún no hay canal directo).
  //    Un fetch por negocio; de ahí salen wa.me, tel:, mailto: y t.me.
  if (
    site &&
    scrapeBudget.left > 0 &&
    !b.whatsappNumbers.length &&
    !b.telegrams.length
  ) {
    scrapeBudget.left--;
    const contacts = await fetchAndExtractContacts(site, 6000);
    if (contacts) {
      siteAlive = true;
      for (const n of contacts.whatsappNumbers) waNumbers.add(normalizePhone(n));
      for (const e of contacts.emails) emails.add(e);
      for (const t of contacts.telegrams) telegrams.add(t);
    }
  }

  // 2) WhatsApp: explícitos primero, luego móviles. Máximo 4 sondeos.
  const phoneCandidates = [
    ...waNumbers,
    ...b.phones.filter((p) => isLikelyMobile(p, b.country)),
    ...b.phones.filter((p) => !isLikelyMobile(p, b.country)),
  ].slice(0, 4);

  let wa: string | null = null;
  if (phoneCandidates.length) {
    const probes = await Promise.allSettled(
      phoneCandidates.map((n) => verifyWhatsAppNumber(n))
    );
    for (let i = 0; i < probes.length; i++) {
      const p = probes[i];
      if (p.status !== "fulfilled" || !p.value.exists) continue;
      if (!nameMatches(b.name, p.value.profileName)) continue;
      wa = phoneCandidates[i];
      break;
    }
  }
  if (wa) {
    return {
      channel: "WHATSAPP",
      data: {
        businessName: b.name,
        niche: b.niche,
        region: b.region,
        contactUrl: `https://wa.me/${wa}`,
        siteUrl: siteAlive ? site : null,
        sourceUrl: b.sourceUrl,
        contactVerified: true,
        phone: wa,
        email: emails.size ? [...emails][0] : null,
        telegram: null,
        channel: "WHATSAPP",
        source: "OSM",
        externalId: b.externalId,
        why: buildWhy(b, "WHATSAPP", siteAlive),
        angle: buildAngle(siteAlive),
        draftMessage: templateMessage(b, "WHATSAPP", siteAlive),
        score: Math.min(99, ruleScore(b) + 12),
        status: "NEW",
      },
    };
  }

  // 3) Telegram
  for (const handle of [...telegrams].slice(0, 1)) {
    const check = await verifyTelegramHandle(handle);
    if (check.exists && check.handle) {
      return {
        channel: "TELEGRAM",
        data: {
          businessName: b.name,
          niche: b.niche,
          region: b.region,
          contactUrl: check.url || `https://t.me/${check.handle}`,
          siteUrl: siteAlive ? site : null,
          sourceUrl: b.sourceUrl,
          contactVerified: true,
          phone: b.phones[0] || null,
          email: emails.size ? [...emails][0] : null,
          telegram: check.handle,
          channel: "TELEGRAM",
          source: "OSM",
          externalId: b.externalId,
          why: buildWhy(b, "TELEGRAM", siteAlive),
          angle: buildAngle(siteAlive),
          draftMessage: templateMessage(b, "TELEGRAM", siteAlive),
          score: Math.min(99, ruleScore(b) + 9),
          status: "NEW",
        },
      };
    }
  }

  // 4) Email con MX válido
  for (const email of [...emails].slice(0, 1)) {
    const check = await verifyEmailDeliverable(email);
    if (check.ok) {
      return {
        channel: "EMAIL",
        data: {
          businessName: b.name,
          niche: b.niche,
          region: b.region,
          contactUrl: `mailto:${email}`,
          siteUrl: siteAlive ? site : null,
          sourceUrl: b.sourceUrl,
          contactVerified: true,
          phone: b.phones[0] || null,
          email,
          telegram: null,
          channel: "EMAIL",
          source: "OSM",
          externalId: b.externalId,
          why: buildWhy(b, "EMAIL", siteAlive),
          angle: buildAngle(siteAlive),
          draftMessage: templateMessage(b, "EMAIL", siteAlive),
          score: Math.min(99, ruleScore(b) + 6),
          status: "NEW",
        },
      };
    }
  }

  // 5) Web viva como último canal
  if (site && !siteAlive) siteAlive = await isUrlAlive(site);
  if (site && siteAlive) {
    return {
      channel: "WEB",
      data: {
        businessName: b.name,
        niche: b.niche,
        region: b.region,
        contactUrl: site,
        siteUrl: site,
        sourceUrl: b.sourceUrl,
        contactVerified: true,
        phone: b.phones[0] || null,
        email: emails.size ? [...emails][0] : null,
        telegram: null,
        channel: "WEB",
        source: "OSM",
        externalId: b.externalId,
        why: buildWhy(b, "WEB", true),
        angle: buildAngle(true),
        draftMessage: templateMessage(b, "WEB", true),
        score: Math.max(30, ruleScore(b) - 15),
        status: "NEW",
      },
    };
  }

  return null;
}

/**
 * Corre una ronda de descubrimiento masivo.
 * @param opts.cities ciudades concretas (si no, rotación automática)
 * @param opts.maxVerify máximo de negocios a verificar por ronda
 * @param opts.budgetMs presupuesto de tiempo (el cron Hobby corta a 60s)
 */
export async function runOsmProspecting(opts?: {
  cities?: OsmCity[];
  maxVerify?: number;
  budgetMs?: number;
  perCity?: number;
}): Promise<OsmProspectingStats> {
  const started = Date.now();
  const deadline = started + (opts?.budgetMs ?? 45000);
  const cities = opts?.cities?.length ? opts.cities : pickCities(2);
  const stats: OsmProspectingStats = {
    found: 0,
    candidates: 0,
    verified: 0,
    inserted: 0,
    discarded: 0,
    duplicated: 0,
    channels: { WHATSAPP: 0, TELEGRAM: 0, EMAIL: 0, WEB: 0 },
    cities: cities.map((c) => c.label),
    aiUpgraded: 0,
    elapsedMs: 0,
  };

  const businesses = await fetchOsmCities(cities, deadline);
  stats.found = businesses.length;
  if (!businesses.length) {
    return { ...stats, error: "Overpass no devolvió negocios (mirrors ocupados)", elapsedMs: Date.now() - started };
  }

  // Dedupe en memoria: mismo nombre normalizado + ciudad
  const seen = new Set<string>();
  const unique = businesses.filter((b) => {
    const key = `${normalizeName(b.name)}|${b.city}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Dedupe contra la DB: externalId, teléfonos, emails y nombre+región
  const existing = await prisma.prospect
    .findMany({ select: { externalId: true, phone: true, email: true, businessName: true, region: true } })
    .catch(() => []);
  const existingIds = new Set(existing.map((e) => e.externalId).filter(Boolean) as string[]);
  const existingPhones = new Set(
    existing.map((e) => normalizePhone(e.phone || "")).filter((p) => p.length >= 8)
  );
  const existingEmails = new Set(existing.map((e) => (e.email || "").toLowerCase()).filter(Boolean));
  const existingNames = new Set(
    existing.map((e) => `${normalizeName(e.businessName)}|${normalizeName(e.region)}`)
  );

  const fresh = unique.filter((b) => {
    if (existingIds.has(b.externalId)) return false;
    if (b.emails.some((e) => existingEmails.has(e))) return false;
    if (b.phones.some((p) => existingPhones.has(normalizePhone(p)))) return false;
    if (existingNames.has(`${normalizeName(b.name)}|${normalizeName(b.region)}`)) return false;
    // Solo negocios con un canal digital posible: WhatsApp, email, Telegram,
    // web o móvil. Un fijo sin nada más no se puede contactar en automático.
    return (
      b.whatsappNumbers.length > 0 ||
      b.emails.length > 0 ||
      b.telegrams.length > 0 ||
      b.websites.length > 0 ||
      b.phones.some((p) => isLikelyMobile(p, b.country))
    );
  });
  stats.duplicated = unique.length - fresh.length;

  // Ranking: primero los que tienen más canales y WhatsApp explícito
  fresh.sort((a, b) => ruleScore(b) - ruleScore(a));
  const perCity = opts?.perCity ?? 80;
  const byCity = new Map<string, OsmBusiness[]>();
  for (const b of fresh) {
    const list = byCity.get(b.city) || [];
    if (list.length < perCity) list.push(b);
    byCity.set(b.city, list);
  }
  const candidates = [...byCity.values()].flat();
  stats.candidates = candidates.length;

  const maxVerify = Math.min(opts?.maxVerify ?? 50, candidates.length);
  const scrapeBudget = { left: 4 };
  const verified: VerifiedBusiness[] = [];

  // Bloques de 8 para no abrir 50 conexiones a la vez
  for (let i = 0; i < maxVerify; i += 8) {
    if (deadline - Date.now() < 6000) break;
    const chunk = candidates.slice(i, Math.min(i + 8, maxVerify));
    const results = await mapLimit(chunk, 8, (b) => verifyBusiness(b, scrapeBudget));
    for (const r of results) {
      if (r) verified.push(r);
      else stats.discarded++;
    }
  }
  stats.verified = verified.length;

  // Insertar sin duplicados por carrera (createMany no soporta skipDuplicates en MySQL)
  let toInsert = verified;
  if (toInsert.length) {
    const ids = toInsert.map((v) => v.data.externalId);
    const already = await prisma.prospect
      .findMany({ where: { externalId: { in: ids } }, select: { externalId: true } })
      .catch(() => []);
    const alreadySet = new Set(already.map((a) => a.externalId));
    toInsert = toInsert.filter((v) => !alreadySet.has(v.data.externalId));

    if (toInsert.length) {
      await prisma.prospect.createMany({ data: toInsert.map((v) => v.data) });
      stats.inserted = toInsert.length;
      for (const v of toInsert) stats.channels[v.channel]++;
    }
  }

  // Enriquecido con IA en UNA llamada (opcional; si falla, quedan las plantillas).
  // Solo si queda tiempo: el tick del motor debe caber en 60s.
  const remainingMs = deadline - Date.now();
  if (toInsert.length && remainingMs > 12000) {
    try {
      const ids = await prisma.prospect.findMany({
        where: { externalId: { in: toInsert.map((v) => v.data.externalId) } },
        select: { id: true },
        orderBy: { score: "desc" },
        take: 10,
      });
      stats.aiUpgraded = await enrichProspectsWithAI(ids.map((p) => p.id), {
        timeoutMs: Math.min(25000, remainingMs - 4000),
      });
    } catch {
      // no bloquea
    }
  }

  stats.elapsedMs = Date.now() - started;
  return stats;
}

const ENRICH_SYSTEM = `Eres el copywriter comercial de Caskiuz (desarrollador full-stack y automatización con IA en Latinoamérica). Recibes una lista de negocios reales y devuelves mensajes de primer contacto en ESPAÑOL.

Devuelve SOLO un JSON válido: {"items":[{"i":0,"angle":"","message":"","score":0}]}

Reglas:
- angle: el servicio que más le conviene y por qué, en 1-2 frases.
- message: primer mensaje listo para enviar por WhatsApp/Telegram, máximo 70 palabras, cercano y profesional. Menciona el nombre del negocio y su nicho/ciudad. NO inventes datos que no estén en la ficha (no afirmes que viste su web si no tiene, no cites reseñas, no inventes cifras).
- score 0-100: calidad del prospecto según canales verificados y encaje.
- Nada de corchetes, placeholders ni firmas largas.`;

/**
 * Mejora ángulo/mensaje/score de hasta 10 prospectos en UNA llamada de IA.
 * Usa la cuota ENRICH (no compite con las rondas de búsqueda PROSPECT).
 */
export async function enrichProspectsWithAI(
  ids: number[],
  opts?: { timeoutMs?: number }
): Promise<number> {
  if (!ids.length) return 0;
  const used = await getAiUsageToday("ENRICH");
  if (used >= 8) return 0;

  const rows = await prisma.prospect.findMany({
    where: { id: { in: ids.slice(0, 10) } },
    select: {
      id: true,
      businessName: true,
      niche: true,
      region: true,
      channel: true,
      siteUrl: true,
      email: true,
      telegram: true,
    },
  });
  if (!rows.length) return 0;

  const result = await callAI({
    system: ENRICH_SYSTEM,
    prompt: `NEGOCIOS:\n${rows
      .map(
        (p, i) =>
          `${i}. ${p.businessName} | ${p.niche} | ${p.region} | canal: ${p.channel || "?"} | web: ${p.siteUrl ? "sí" : "no"}`
      )
      .join("\n")}\n\nResponde con el JSON pedido.`,
    temperature: 0.6,
    maxOutputTokens: 1800,
    json: true,
    lite: true,
    timeoutMs: Math.min(Math.max(opts?.timeoutMs ?? 40000, 8000), 40000),
  });
  if (!result.ok) return 0;

  const data = extractJson<{ items?: { i?: number; angle?: string; message?: string; score?: number }[] }>(
    result.text
  );
  if (!data?.items?.length) return 0;
  await checkAndIncrementAiQuota("ENRICH");

  let updated = 0;
  for (const item of data.items) {
    const idx = Number(item.i);
    if (!Number.isInteger(idx) || idx < 0 || idx >= rows.length) continue;
    const angle = (item.angle || "").trim().slice(0, 1200);
    const message = (item.message || "").trim().slice(0, 1200);
    const score = Math.max(0, Math.min(99, Math.round(Number(item.score) || 0)));
    if (!angle && !message && !score) continue;
    try {
      await prisma.prospect.update({
        where: { id: rows[idx].id },
        data: {
          ...(angle ? { angle } : {}),
          ...(message ? { draftMessage: message } : {}),
          ...(score ? { score } : {}),
        },
      });
      updated++;
    } catch {
      // sigue con el resto
    }
  }
  return updated;
}
