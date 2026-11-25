/**
 * Verificación de contactos para la prospección — el anti-alucinación.
 * La IA alucina números y URLs aunque use Google Search; aquí TODO lo que
 * llega a la base pasa por comprobaciones reales y gratis:
 *
 * 1. wa.me/{número} → la página renderiza server-side el NOMBRE de la cuenta
 *    en og:title cuando el número existe ("Caskiuz", "Business Account");
 *    un número inexistente devuelve el genérico "Share on WhatsApp".
 * 2. t.me/{usuario} → la vista pública devuelve el nombre del canal/persona;
 *    un usuario inexistente devuelve "Telegram: Contact @…" sin ficha.
 * 3. El email se valida por sintaxis + registros MX del dominio (Google DNS
 *    sobre HTTPS cuando el runtime no permite dns, o dns nativo en Node).
 * 4. Los links de contacto se EXTRAEN del HTML de las páginas fuente reales
 *    (las que Google devolvió en el grounding), no se aceptan de memoria.
 * 5. Toda URL se comprueba viva (HTTP < 400) antes de guardarse.
 */

import { promises as dns } from "node:dns";

const FETCH_TIMEOUT_MS = 8000;
const GENERIC_WA_TITLES = new Set(["share on whatsapp", "whatsapp", "whatsapp.com"]);

export interface WhatsAppCheck {
  exists: boolean;
  /** Nombre público de la cuenta en WhatsApp (para cruzar contra el negocio) */
  profileName: string | null;
}

/** Limpia un teléfono a dígitos (quita 00 inicial). */
export function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

/**
 * Heurística de móvil para priorizar sondeos de WhatsApp (los fijos casi
 * nunca tienen WhatsApp). No bloquea: solo ordena.
 */
export function isLikelyMobile(digits: string, country?: string): boolean {
  if (!digits) return false;
  // Venezuela: +58 4xx (0412, 0414, 0416, 0424, 0426…)
  if (digits.startsWith("584")) return true;
  if (digits.startsWith("04") && digits.length >= 10) return true;
  // Colombia: +57 3xx
  if (digits.startsWith("573")) return true;
  if (digits.startsWith("3") && digits.length === 10) return true;
  // México: +52 1… o 55/56/81/33 fijos; celular suele ser 10 dígitos
  if (digits.startsWith("521")) return true;
  // España: +34 6xx/7xx
  if (digits.startsWith("346") || digits.startsWith("347")) return true;
  // Perú: +51 9xx
  if (digits.startsWith("519")) return true;
  // Chile: +56 9…
  if (digits.startsWith("569")) return true;
  // Argentina: +54 9…
  if (digits.startsWith("549")) return true;
  if (country === "VE") return digits.startsWith("4");
  return false;
}

/** Comprueba si un número tiene cuenta de WhatsApp y cómo se llama. */
export async function verifyWhatsAppNumber(digits: string): Promise<WhatsAppCheck> {
  const clean = normalizePhone(digits);
  if (clean.length < 8 || clean.length > 15) return { exists: false, profileName: null };
  try {
    const res = await fetch(`https://wa.me/${clean}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; caskiuz-verifier/1.0)" },
    });
    if (!res.ok) return { exists: false, profileName: null };
    const html = await res.text();
    const match = /<meta\s+property="og:title"\s+content="([^"]*)"/i.exec(html);
    const title = match?.[1]?.trim() ?? "";
    if (!title) return { exists: false, profileName: null };
    // El genérico = el número no pertenece a ninguna cuenta
    if (GENERIC_WA_TITLES.has(title.toLowerCase())) {
      return { exists: false, profileName: null };
    }
    return { exists: true, profileName: title };
  } catch {
    return { exists: false, profileName: null };
  }
}

export interface TelegramCheck {
  exists: boolean;
  handle: string | null;
  profileName: string | null;
  description: string | null;
  url: string | null;
}

/** Acepta "@user", "user", "https://t.me/user" y devuelve el handle limpio. */
export function normalizeTelegramHandle(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();
  const urlMatch = s.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{4,64})/i);
  if (urlMatch) s = urlMatch[1];
  s = s.replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, "");
  if (s.length < 4 || s.length > 64) return null;
  if (/^(joinchat|addstickers|share|iv|s)$/i.test(s)) return null;
  return s;
}

/**
 * Verifica un usuario/canal público de Telegram por su página t.me.
 * No usa la API del bot (los bots no pueden consultar usuarios ajenos):
 * la vista previa pública sí es accesible sin login y es gratis.
 */
export async function verifyTelegramHandle(raw: string): Promise<TelegramCheck> {
  const handle = normalizeTelegramHandle(raw);
  if (!handle) return { exists: false, handle: null, profileName: null, description: null, url: null };
  const url = `https://t.me/${handle}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; caskiuz-verifier/1.0)" },
    });
    if (!res.ok) return { exists: false, handle, profileName: null, description: null, url };
    const html = await res.text();
    const title =
      /<meta\s+property="og:title"\s+content="([^"]*)"/i.exec(html)?.[1]?.trim() ?? "";
    const description =
      /<meta\s+property="og:description"\s+content="([^"]*)"/i.exec(html)?.[1]?.trim() ?? "";
    // Usuario inexistente: la vista previa NO trae la ficha tgme_page_title
    // y el título es el genérico "Telegram: Contact @handle".
    const hasProfileCard = /class="tgme_page_title"/i.test(html);
    const generic = !title || /^telegram:\s*contact\s*@/i.test(title);
    if (!hasProfileCard || generic) {
      return { exists: false, handle, profileName: null, description: null, url };
    }
    return { exists: true, handle, profileName: title || null, description: description || null, url };
  } catch {
    return { exists: false, handle, profileName: null, description: null, url };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export interface EmailCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Valida un email: sintaxis + el dominio debe tener registros MX.
 * Usa dns nativo (Node runtime). Si el DNS falla por red, no bloquea.
 */
export async function verifyEmailDeliverable(email: string): Promise<EmailCheck> {
  const clean = (email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(clean) || clean.length > 190) return { ok: false, reason: "sintaxis" };
  const domain = clean.split("@")[1];
  if (!domain || /(example|test|localhost|dominio)\./i.test(domain)) {
    return { ok: false, reason: "dominio de prueba" };
  }
  try {
    const mx = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    if (!mx.length) return { ok: false, reason: "sin MX" };
    return { ok: true };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return { ok: false, reason: "dominio sin correo" };
    }
    // Timeout/resolver caído: no descartamos un lead válido por la red
    return { ok: true, reason: "MX no verificado (red)" };
  }
}

export interface ExtractedContacts {
  whatsappNumbers: string[];
  plainUrls: string[];
  emails: string[];
  telegrams: string[];
  instagrams: string[];
}

/** Extrae links de contacto reales del HTML de una página. */
export function extractContactLinks(html: string): ExtractedContacts {
  const numbers = new Set<string>();
  for (const m of html.matchAll(/wa\.me\/(\d{8,15})/g)) numbers.add(m[1]);
  for (const m of html.matchAll(/api\.whatsapp\.com\/send\/?\?(?:[^"'\s]*&)?phone=(\d{8,15})/g)) {
    numbers.add(m[1]);
  }
  for (const m of html.matchAll(/href=["']tel:\+?(\d{8,15})["']/gi)) numbers.add(m[1]);

  const emails = new Set<string>();
  for (const m of html.matchAll(/href=["']mailto:([^"'?>\s]+)/gi)) {
    const e = decodeURIComponent(m[1]).trim().toLowerCase();
    if (EMAIL_RE.test(e)) emails.add(e);
  }
  // Emails visibles en texto (muchos negocios los escriben sin mailto)
  for (const m of html.matchAll(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi)) {
    const e = m[0].toLowerCase();
    if (!/\.(png|jpe?g|webp|svg|gif|css|js)$/i.test(e) && EMAIL_RE.test(e)) emails.add(e);
  }

  const telegrams = new Set<string>();
  for (const m of html.matchAll(/(?:https?:\/\/)?t\.me\/([A-Za-z0-9_]{4,64})/gi)) {
    const h = normalizeTelegramHandle(m[1]);
    if (h) telegrams.add(h);
  }

  const instagrams = new Set<string>();
  for (const m of html.matchAll(/instagram\.com\/([A-Za-z0-9_.]{2,40})/gi)) {
    const h = m[1].replace(/\.+$/, "");
    if (!/^(p|reel|reels|stories|explore|tv|accounts)$/i.test(h)) instagrams.add(h);
  }

  const urls = new Set<string>();
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"'\s>]+)["']/gi)) {
    const u = m[1];
    // Solo páginas de contacto/sobre/redes: el resto es ruido
    if (/(contact|contacto|about|nosotros|instagram\.com|facebook\.com|tiktok\.com|linkedin\.com)/i.test(u)) {
      urls.add(u.split("#")[0]);
    }
  }
  return {
    whatsappNumbers: [...numbers],
    plainUrls: [...urls].slice(0, 5),
    emails: [...emails].slice(0, 5),
    telegrams: [...telegrams].slice(0, 3),
    instagrams: [...instagrams].slice(0, 3),
  };
}

/** Descarga una página y extrae sus contactos. null si está muerta o cae. */
export async function fetchAndExtractContacts(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<ExtractedContacts | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; caskiuz-verifier/1.0)" },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return null;
    return extractContactLinks(await res.text());
  } catch {
    return null;
  }
}

/** URL viva = responde HTTP < 400 dentro del timeout. */
export async function isUrlAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; caskiuz-verifier/1.0)" },
    });
    return res.status < 400;
  } catch {
    return false;
  }
}

/**
 * ¿El nombre de la cuenta de WhatsApp coincide razonablemente con el negocio?
 * Compara tokens normalizados (sin acentos, ≥4 letras, sin stopwords).
 */
export function nameMatches(businessName: string, profileName: string | null): boolean {
  if (!profileName) return true; // sin nombre que cruzar, no se bloquea
  const STOP = ["el", "la", "los", "las", "de", "del", "y", "e", "sa", "c_a", "rest", "restaurante", "cafe", "bar", "pizzeria", "srl", "c.a", "ca"];
  const tokens = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9ñ]+/)
      .filter((t) => t.length >= 4 && !STOP.includes(t));
  const a = new Set(tokens(businessName));
  const b = tokens(profileName);
  if (a.size === 0 || b.length === 0) return true; // no comparable: no bloquea
  return b.some((t) => a.has(t));
}
