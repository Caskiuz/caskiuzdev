/**
 * Verificación de contactos para la prospección — el anti-alucinación.
 * La IA alucina números y URLs aunque use Google Search; aquí TODO lo que
 * llega a la base pasa por comprobaciones reales y gratis:
 *
 * 1. wa.me/{número} → la página renderiza server-side el NOMBRE de la cuenta
 *    en og:title cuando el número existe ("Caskiuz", "Business Account");
 *    un número inexistente devuelve el genérico "Share on WhatsApp".
 * 2. Los links de contacto se EXTRAEN del HTML de las páginas fuente reales
 *    (las que Google devolvió en el grounding), no se aceptan de memoria.
 * 3. Toda URL se comprueba viva (HTTP < 400) antes de guardarse.
 */

const FETCH_TIMEOUT_MS = 8000;
const GENERIC_WA_TITLES = new Set(["share on whatsapp", "whatsapp", "whatsapp.com"]);

export interface WhatsAppCheck {
  exists: boolean;
  /** Nombre público de la cuenta en WhatsApp (para cruzar contra el negocio) */
  profileName: string | null;
}

/** Comprueba si un número tiene cuenta de WhatsApp y cómo se llama. */
export async function verifyWhatsAppNumber(digits: string): Promise<WhatsAppCheck> {
  const clean = digits.replace(/\D/g, "");
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

export interface ExtractedContacts {
  whatsappNumbers: string[];
  plainUrls: string[];
}

/** Extrae links de contacto reales del HTML de una página. */
export function extractContactLinks(html: string): ExtractedContacts {
  const numbers = new Set<string>();
  for (const m of html.matchAll(/wa\.me\/(\d{8,15})/g)) numbers.add(m[1]);
  for (const m of html.matchAll(/api\.whatsapp\.com\/send\/?\?(?:[^"'\s]*&)?phone=(\d{8,15})/g)) {
    numbers.add(m[1]);
  }
  for (const m of html.matchAll(/href=["']tel:\+?(\d{8,15})["']/gi)) numbers.add(m[1]);

  const urls = new Set<string>();
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"'\s>]+)["']/gi)) {
    const u = m[1];
    // Solo páginas de contacto/sobre/redes: el resto es ruido
    if (/(contact|contacto|about|nosotros|instagram\.com|facebook\.com|tiktok\.com|linkedin\.com)/i.test(u)) {
      urls.add(u.split("#")[0]);
    }
  }
  return { whatsappNumbers: [...numbers], plainUrls: [...urls].slice(0, 5) };
}

/** Descarga una página y extrae sus contactos. null si está muerta o cae. */
export async function fetchAndExtractContacts(url: string): Promise<ExtractedContacts | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
