import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Auditoría web instantánea y gratuita (lead magnet).
 * Analiza una URL pública sin IA ni APIs de pago: HTTPS, SEO on-page,
 * mobile, schema, velocidad (TTFB), imágenes sin alt, WhatsApp y analítica.
 *
 * Protección SSRF: solo http/https, bloquea localhost, IPs privadas y
 * metadata de cloud; valida también la URL final tras redirecciones.
 */

const TIMEOUT_MS = 12000;

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "::1" || h === "0.0.0.0") return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

function normalizeUrl(raw: string): URL | null {
  let value = (raw || "").trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (isPrivateHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function metaContent(html: string, attr: "name" | "property", key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${key}["']`,
    "i"
  );
  return (re.exec(html)?.[1] || alt.exec(html)?.[1] || "").trim() || null;
}

interface Issue {
  severity: "alta" | "media" | "baja";
  title: string;
  detail: string;
  fix: string;
}

function buildIssues(input: {
  https: boolean;
  title: string | null;
  description: string | null;
  h1Count: number;
  hasViewport: boolean;
  hasCanonical: boolean;
  schemaTypes: string[];
  images: number;
  imagesNoAlt: number;
  hasWhatsApp: boolean;
  hasAnalytics: boolean;
  hasOg: boolean;
  ttfbMs: number;
  htmlKb: number;
  hasLang: boolean;
}): Issue[] {
  const issues: Issue[] = [];
  if (!input.https) {
    issues.push({
      severity: "alta",
      title: "La web no usa HTTPS",
      detail: "Los navegadores la marcan como 'No segura' y Google penaliza la confianza.",
      fix: "Certificado SSL gratis (Vercel/Cloudflare) y redirección 301 de http a https.",
    });
  }
  if (!input.title) {
    issues.push({
      severity: "alta",
      title: "Falta el título SEO (<title>)",
      detail: "Es lo que se ve en Google y en la pestaña del navegador.",
      fix: "Un título único de 50-60 caracteres con la ciudad y el servicio principal.",
    });
  } else if (input.title.length < 15 || input.title.length > 65) {
    issues.push({
      severity: "media",
      title: `El título mide ${input.title.length} caracteres`,
      detail: "Los títulos muy cortos o largos se recortan en Google y pierden clics.",
      fix: "Déjalo entre 50 y 60 caracteres, con la palabra clave al inicio.",
    });
  }
  if (!input.description) {
    issues.push({
      severity: "alta",
      title: "Falta la meta descripción",
      detail: "Google escribe su propio texto y suele empeorar el CTR.",
      fix: "Una descripción de 140-160 caracteres con beneficio + llamada a la acción.",
    });
  } else if (input.description.length < 50 || input.description.length > 165) {
    issues.push({
      severity: "baja",
      title: `La meta descripción mide ${input.description.length} caracteres`,
      detail: "Fuera del rango que Google muestra completo.",
      fix: "Ajusta a 140-160 caracteres.",
    });
  }
  if (!input.hasViewport) {
    issues.push({
      severity: "alta",
      title: "No es responsive (falta viewport)",
      detail: "En móvil se ve como un sitio de escritorio reducido; más del 70% del tráfico es móvil.",
      fix: "Añadir <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> y revisar el diseño móvil.",
    });
  }
  if (input.h1Count === 0) {
    issues.push({
      severity: "media",
      title: "No hay un H1 claro",
      detail: "Google no entiende de qué trata la página principal.",
      fix: "Un solo H1 con el servicio + ciudad (p. ej. 'Diseño web en San Cristóbal').",
    });
  } else if (input.h1Count > 1) {
    issues.push({
      severity: "baja",
      title: `Hay ${input.h1Count} etiquetas H1`,
      detail: "Varios H1 diluyen el tema principal de la página.",
      fix: "Deja uno solo y convierte el resto en H2.",
    });
  }
  if (!input.hasCanonical) {
    issues.push({
      severity: "baja",
      title: "Falta la URL canónica",
      detail: "Puede generar contenido duplicado si la web responde en varias URLs.",
      fix: "Añadir <link rel=\"canonical\"> a la versión principal de cada página.",
    });
  }
  if (!input.schemaTypes.length) {
    issues.push({
      severity: "media",
      title: "Sin datos estructurados (Schema.org)",
      detail: "No aparecen estrellas, precios ni datos de negocio en los resultados de Google.",
      fix: "Añadir JSON-LD de LocalBusiness/Service y FAQPage.",
    });
  }
  if (input.images > 0 && input.imagesNoAlt / input.images > 0.3) {
    issues.push({
      severity: "media",
      title: `${input.imagesNoAlt} de ${input.images} imágenes sin texto alternativo`,
      detail: "Se pierde accesibilidad y posicionamiento en Google Imágenes.",
      fix: "Describir cada imagen en el atributo alt con lenguaje natural.",
    });
  }
  if (!input.hasWhatsApp) {
    issues.push({
      severity: "media",
      title: "No hay un botón de WhatsApp visible",
      detail: "En LatAm es el canal de venta principal; sin él se pierden pedidos.",
      fix: "Botón flotante de WhatsApp con mensaje precargado y clic medible.",
    });
  }
  if (!input.hasAnalytics) {
    issues.push({
      severity: "media",
      title: "No se detecta analítica (GA4 / Pixel)",
      detail: "No se puede saber qué visitas convierten ni optimizar campañas.",
      fix: "Instalar GA4 + Meta Pixel y medir clics de WhatsApp y envíos de formulario.",
    });
  }
  if (!input.hasOg) {
    issues.push({
      severity: "baja",
      title: "Sin Open Graph",
      detail: "Al compartir la web por WhatsApp/redes no aparece imagen ni descripción.",
      fix: "Añadir og:title, og:description y og:image (1200×630).",
    });
  }
  if (!input.hasLang) {
    issues.push({
      severity: "baja",
      title: "Falta el atributo lang",
      detail: "Afecta a accesibilidad y a la detección de idioma de Google.",
      fix: "Añadir lang=\"es\" a la etiqueta <html>.",
    });
  }
  if (input.ttfbMs > 2500) {
    issues.push({
      severity: "alta",
      title: `El servidor tarda ${(input.ttfbMs / 1000).toFixed(1)}s en responder`,
      detail: "Cada segundo extra reduce las conversiones ~7%. Google lo mide en Core Web Vitals.",
      fix: "Caché/ISR, CDN y hosting estático (Vercel) para bajar el TTFB a <500ms.",
    });
  } else if (input.ttfbMs > 1200) {
    issues.push({
      severity: "media",
      title: `El servidor tarda ${(input.ttfbMs / 1000).toFixed(1)}s en responder`,
      detail: "Por encima de 1s ya se nota en móvil.",
      fix: "Caché en el servidor y CDN.",
    });
  }
  if (input.htmlKb > 1500) {
    issues.push({
      severity: "media",
      title: `El HTML pesa ${input.htmlKb} KB`,
      detail: "Páginas muy pesadas tardan más en el primer render.",
      fix: "Reducir HTML, dividir componentes y comprimir imágenes.",
    });
  }
  return issues;
}

export async function POST(request: NextRequest) {
  let body: { url?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const url = normalizeUrl(body.url || "");
  if (!url) {
    return NextResponse.json(
      { error: "URL inválida. Escribe un dominio público, por ejemplo: tunegocio.com" },
      { status: 400 }
    );
  }

  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.6",
      },
    });
  } catch (error) {
    const msg =
      error instanceof Error && error.name === "TimeoutError"
        ? "La web tardó más de 12 segundos en responder."
        : "No se pudo cargar la web (dominio caído, bloqueo o error de red).";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
  const ttfbMs = Date.now() - started;

  // La redirección pudo llevar a una IP privada: se corta.
  try {
    if (isPrivateHost(new URL(res.url).hostname)) {
      return NextResponse.json({ error: "URL no permitida" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "URL no permitida" }, { status: 400 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `La web respondió HTTP ${res.status}. Revisa que sea la URL pública correcta.` },
      { status: 422 }
    );
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return NextResponse.json({ error: "La URL no devuelve una página HTML." }, { status: 422 });
  }

  const html = (await res.text()).slice(0, 3_000_000);
  const totalMs = Date.now() - started;
  const htmlKb = Math.round(Buffer.byteLength(html, "utf8") / 1024);

  const title = (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const description = metaContent(html, "name", "description");
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const hasLang = /<html[^>]+lang=["'][^"']+["']/i.test(html);
  const hasOg = Boolean(metaContent(html, "property", "og:title") || metaContent(html, "property", "og:image"));
  const hasWhatsApp = /wa\.me\/|api\.whatsapp\.com|whatsapp\.com\/send/i.test(html);
  const hasAnalytics = /gtag\(|googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|fbq\(/i.test(html);
  const images = (html.match(/<img\b/gi) || []).length;
  const imagesNoAlt = (html.match(/<img\b[^>]*>/gi) || []).filter(
    (tag) => !/\balt=["'][^"']+["']/i.test(tag)
  ).length;
  const schemaTypes = Array.from(
    new Set(
      [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]).filter(Boolean)
    )
  ).slice(0, 6);
  const looksResponsive = hasViewport || /tailwind|bootstrap|@media/i.test(html);

  const https = url.protocol === "https:" && res.url.startsWith("https://");
  const issues = buildIssues({
    https,
    title: title || null,
    description,
    h1Count,
    hasViewport: looksResponsive,
    hasCanonical,
    schemaTypes,
    images,
    imagesNoAlt,
    hasWhatsApp,
    hasAnalytics,
    hasOg,
    ttfbMs,
    htmlKb,
    hasLang,
  });

  // Score: parte de 100 y descuenta por severidad
  const penalty = issues.reduce(
    (sum, i) => sum + (i.severity === "alta" ? 18 : i.severity === "media" ? 9 : 4),
    0
  );
  const score = Math.max(5, Math.min(100, 100 - penalty));
  const grade =
    score >= 90 ? "Excelente" : score >= 75 ? "Bien" : score >= 60 ? "Mejorable" : score >= 40 ? "Débil" : "Crítico";

  const tech: string[] = [];
  if (/_next\//i.test(html)) tech.push("Next.js");
  if (/wp-content|wp-includes/i.test(html)) tech.push("WordPress");
  if (/cdn\.shopify\.com/i.test(html)) tech.push("Shopify");
  if (/wix\.com|wixstatic/i.test(html)) tech.push("Wix");
  if (/squarespace/i.test(html)) tech.push("Squarespace");
  if (/webflow/i.test(html)) tech.push("Webflow");
  if (/elementor/i.test(html)) tech.push("Elementor");
  if (/react/i.test(html)) tech.push("React");

  return NextResponse.json({
    url: res.url,
    score,
    grade,
    metrics: {
      https,
      ttfbMs,
      totalMs,
      htmlKb,
      title: title || null,
      titleLength: title.length,
      description,
      descriptionLength: description?.length ?? 0,
      h1Count,
      images,
      imagesNoAlt,
      schemaTypes,
      hasWhatsApp,
      hasAnalytics,
      hasViewport: looksResponsive,
      hasCanonical,
      tech,
    },
    issues,
  });
}
