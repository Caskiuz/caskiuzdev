/**
 * Fuente de prospectos 100% gratis y sin API key: OpenStreetMap vía Overpass.
 *
 * Por qué OSM: los negocios locales están mapeados con teléfono, email, web,
 * Instagram o Telegram en sus etiquetas. No es scraping de Google Maps ni
 * cuesta un céntimo. La consulta pide SOLO POIs que ya traen algún contacto,
 * así que el volumen útil es alto (Caracas devuelve cientos de teléfonos y
 * emails en una sola consulta de 3 segundos).
 *
 * - Multi-mirror con rotación pegajosa: si un servidor Overpass está saturado
 *   (502/504) o no responde, salta al siguiente sin romper el motor.
 * - Ciudades con coordenadas fijas (sin geocoder): rotan por día/hora para
 *   cubrir Venezuela, Colombia, LatAm y España poco a poco.
 * - El resultado se normaliza y la verificación real (wa.me/t.me/MX) la hace
 *   prospect-engine.ts — aquí no se da nada por bueno.
 */

import { request as httpsRequest } from "node:https";

const TIMEOUT_MS = 18000;

export interface OsmCity {
  slug: string;
  label: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  radius: number;
}

/** Catálogo de ciudades (las 2 primeras rotan por día; San Cristóbal es fija). */
export const OSM_CITIES: OsmCity[] = [
  { slug: "san-cristobal", label: "San Cristóbal", region: "Táchira, Venezuela", country: "VE", lat: 7.77, lon: -72.22, radius: 10000 },
  { slug: "cucuta", label: "Cúcuta", region: "Norte de Santander, Colombia", country: "CO", lat: 7.89, lon: -72.5, radius: 10000 },
  { slug: "maracaibo", label: "Maracaibo", region: "Zulia, Venezuela", country: "VE", lat: 10.65, lon: -71.61, radius: 10000 },
  { slug: "caracas", label: "Caracas", region: "Distrito Capital, Venezuela", country: "VE", lat: 10.48, lon: -66.9, radius: 10000 },
  { slug: "valencia-ve", label: "Valencia", region: "Carabobo, Venezuela", country: "VE", lat: 10.16, lon: -68.0, radius: 10000 },
  { slug: "barquisimeto", label: "Barquisimeto", region: "Lara, Venezuela", country: "VE", lat: 10.07, lon: -69.32, radius: 10000 },
  { slug: "merida-ve", label: "Mérida", region: "Mérida, Venezuela", country: "VE", lat: 8.59, lon: -71.14, radius: 8000 },
  { slug: "bogota", label: "Bogotá", region: "Cundinamarca, Colombia", country: "CO", lat: 4.65, lon: -74.08, radius: 9000 },
  { slug: "medellin", label: "Medellín", region: "Antioquia, Colombia", country: "CO", lat: 6.24, lon: -75.58, radius: 8000 },
  { slug: "lima", label: "Lima", region: "Lima, Perú", country: "PE", lat: -12.05, lon: -77.04, radius: 8000 },
  { slug: "santiago", label: "Santiago", region: "Región Metropolitana, Chile", country: "CL", lat: -33.45, lon: -70.66, radius: 8000 },
  { slug: "buenos-aires", label: "Buenos Aires", region: "CABA, Argentina", country: "AR", lat: -34.6, lon: -58.38, radius: 8000 },
  { slug: "ciudad-de-mexico", label: "Ciudad de México", region: "CDMX, México", country: "MX", lat: 19.43, lon: -99.13, radius: 8000 },
  { slug: "madrid", label: "Madrid", region: "Madrid, España", country: "ES", lat: 40.42, lon: -3.7, radius: 8000 },
  { slug: "barcelona-es", label: "Barcelona", region: "Cataluña, España", country: "ES", lat: 41.39, lon: 2.17, radius: 8000 },
];

const MIRRORS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

let mirrorIdx = 0;

const NICHE_LABELS: Record<string, string> = {
  restaurant: "Restaurante",
  cafe: "Cafetería",
  fast_food: "Comida rápida",
  food_court: "Plaza de comida",
  pub: "Pub",
  bar: "Bar",
  nightclub: "Discoteca",
  bakery: "Panadería",
  pastry: "Pastelería",
  ice_cream: "Heladería",
  butcher: "Carnicería",
  greengrocer: "Verdulería",
  supermarket: "Supermercado",
  convenience: "Bodega",
  clothes: "Tienda de ropa",
  shoes: "Zapatería",
  boutique: "Boutique",
  jewelry: "Joyería",
  florist: "Floristería",
  furniture: "Mueblería",
  electronics: "Tienda de electrónica",
  mobile_phone: "Tienda de celulares",
  computer: "Tienda de informática",
  optician: "Óptica",
  hairdresser: "Peluquería",
  beauty: "Salón de belleza",
  tattoo: "Estudio de tatuajes",
  car_repair: "Taller mecánico",
  car: "Concesionario",
  car_parts: "Repuestos de auto",
  pet: "Tienda de mascotas",
  veterinary: "Veterinaria",
  dentist: "Clínica dental",
  clinic: "Clínica",
  doctors: "Consultorio médico",
  pharmacy: "Farmacia",
  physiotherapist: "Fisioterapia",
  psychologist: "Psicología",
  gym: "Gimnasio",
  fitness_centre: "Centro de fitness",
  spa: "Spa",
  travel_agency: "Agencia de viajes",
  hotel: "Hotel",
  guest_house: "Posada",
  hostel: "Hostal",
  driving_school: "Escuela de conducción",
  language_school: "Academia de idiomas",
  school: "Colegio",
  kindergarten: "Jardín de infancia",
  lawyer: "Abogado",
  accountant: "Contador",
  estate_agent: "Inmobiliaria",
  insurance: "Seguros",
  financial: "Asesoría financiera",
  company: "Empresa",
  it: "Servicios IT",
  consulting: "Consultoría",
  employment_agency: "Agencia de empleo",
  architect: "Arquitectura",
  engineer: "Ingeniería",
  photographer: "Fotografía",
  craft: "Taller artesanal",
  photographer_craft: "Fotografía",
  caterer: "Catering",
  event: "Eventos",
  printing: "Imprenta",
  laundry: "Lavandería",
  dry_cleaning: "Tintorería",
  funeral_directors: "Funeraria",
  storage_rental: "Almacenaje",
};

export interface OsmBusiness {
  externalId: string;
  sourceUrl: string;
  name: string;
  niche: string;
  region: string;
  city: string;
  country: string;
  phones: string[];
  emails: string[];
  whatsappNumbers: string[];
  websites: string[];
  telegrams: string[];
  instagrams: string[];
  facebook: string | null;
  address: string | null;
}

function firstTag(tags: Record<string, string>, keys: string[]): string | null {
  for (const k of keys) {
    const v = tags[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
}

function splitValues(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,|\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function addHttps(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^www\./i.test(v) || /^[\w-]+\.[a-z]{2,}(\/|$)/i.test(v)) return `https://${v}`;
  return null;
}

function extractDigits(raw: string): string[] {
  const out: string[] = [];
  // Los teléfonos pueden venir como "+58 414-1234567; +58 276 1234567"
  for (const part of raw.split(/[;/|]/)) {
    const digits = part.replace(/\D/g, "").replace(/^00/, "");
    if (digits.length >= 8 && digits.length <= 15) out.push(digits);
  }
  return out;
}

function parseElement(el: {
  type: string;
  id: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
}): OsmBusiness | null {
  const tags = el.tags || {};
  const name = (tags.name || tags["name:es"] || "").trim();
  if (!name || name.length < 2) return null;

  const phones = [
    ...splitValues(firstTag(tags, ["phone", "contact:phone", "contact:mobile", "mobile"])).flatMap(extractDigits),
  ];
  const whatsappNumbers = splitValues(
    firstTag(tags, ["contact:whatsapp", "whatsapp"])
  ).flatMap((v) => {
    const byUrl = v.match(/wa\.me\/(\d{8,15})/i) || v.match(/phone=(\d{8,15})/i);
    return byUrl ? [byUrl[1]] : extractDigits(v);
  });
  const emails = splitValues(firstTag(tags, ["email", "contact:email"]))
    .map((e) => e.toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e));
  const websites = splitValues(firstTag(tags, ["website", "contact:website", "url"]))
    .map(addHttps)
    .filter((u): u is string => Boolean(u));
  const telegrams = splitValues(firstTag(tags, ["contact:telegram", "telegram"]));
  const instagrams = splitValues(firstTag(tags, ["contact:instagram", "instagram"]));

  const category =
    tags.shop ||
    tags.amenity ||
    tags.office ||
    tags.craft ||
    tags.healthcare ||
    tags.tourism ||
    tags.leisure ||
    "";
  const niche = NICHE_LABELS[category] || (category ? category.replace(/_/g, " ") : "Negocio local");

  const addressParts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
  ].filter(Boolean);

  const coords = el.center || (el.lat != null && el.lon != null ? { lat: el.lat, lon: el.lon } : null);

  return {
    externalId: `osm:${el.type}/${el.id}`,
    sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    name: name.slice(0, 190),
    niche,
    region: "",
    city: "",
    country: "",
    phones,
    emails,
    whatsappNumbers,
    websites,
    telegrams,
    instagrams,
    facebook: firstTag(tags, ["contact:facebook", "facebook"]),
    address: addressParts.length ? addressParts.join(" ").slice(0, 200) : coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : null,
  };
}

function buildQuery(city: OsmCity): string {
  return `[out:json][timeout:20];
nwr(around:${city.radius},${city.lat},${city.lon})["name"][~"^(shop|amenity|office|craft|tourism|healthcare|leisure)$"~"."][~"^(phone|contact:phone|contact:whatsapp|contact:mobile|email|contact:email|website|contact:website|contact:telegram|contact:instagram|contact:facebook)$"~"."];
out tags center 400;`;
}

/**
 * POST de formulario con https nativo. Next parchea fetch() y algunos
 * mirrors de Overpass rechazan sus cabeceras (403/406); con https.request
 * enviamos exactamente lo que queremos y funciona igual en Vercel.
 */
function postForm(
  url: string,
  body: string,
  timeoutMs: number
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "caskiuz-prospector/1.0",
          Accept: "application/json",
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
          if (data.length > 8_000_000) req.destroy(new Error("respuesta demasiado grande"));
        });
        res.on("end", () => resolve({ status: res.statusCode || 0, text: data }));
      }
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Descarga los negocios con contacto de una ciudad, rotando mirrors.
 * Máximo 2 intentos y timeout corto: el cron Hobby vive 60s; es mejor
 * volver en el siguiente tick que colgarse esperando un mirror saturado.
 */
export async function fetchOsmCity(
  city: OsmCity,
  opts?: { timeoutMs?: number; attempts?: number }
): Promise<OsmBusiness[]> {
  const body = `data=${encodeURIComponent(buildQuery(city))}`;
  const timeoutMs = Math.min(Math.max(opts?.timeoutMs ?? TIMEOUT_MS, 8000), 25000);
  const attempts = Math.min(Math.max(opts?.attempts ?? 2, 1), MIRRORS.length);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const mirror = MIRRORS[(mirrorIdx + attempt) % MIRRORS.length];
    try {
      const res = await postForm(mirror, body, timeoutMs);
      if (res.status !== 200) {
        console.warn(`Overpass ${mirror} → HTTP ${res.status}`);
        continue;
      }
      const data = JSON.parse(res.text) as { elements?: Parameters<typeof parseElement>[0][] };
      const elements = data.elements || [];
      const out: OsmBusiness[] = [];
      for (const el of elements) {
        const parsed = parseElement(el);
        if (!parsed) continue;
        parsed.city = city.label;
        parsed.region = city.region;
        parsed.country = city.country;
        out.push(parsed);
      }
      // Mirror vivo: se queda como primera opción para la próxima consulta
      mirrorIdx = (mirrorIdx + attempt) % MIRRORS.length;
      return out;
    } catch (error) {
      console.warn(
        `Overpass ${mirror} falló: ${error instanceof Error ? error.message : "error"}`
      );
    }
  }
  return [];
}

/**
 * Ciudades de la ronda: San Cristóbal siempre (base local) + una rotativa.
 * La rotación usa día y hora para que dos ejecuciones del mismo día cubran
 * ciudades distintas sin repetir la misma en cada tick del motor.
 */
export function pickCities(count = 2): OsmCity[] {
  const base = OSM_CITIES[0];
  const rest = OSM_CITIES.slice(1);
  const seed = Math.floor(Date.now() / (3 * 60 * 60 * 1000)); // cambia cada 3h
  const picked: OsmCity[] = [base];
  for (let i = 0; i < count - 1; i++) {
    picked.push(rest[(seed + i * 5) % rest.length]);
  }
  return picked;
}

/**
 * Descarga varias ciudades EN SERIE (nunca en paralelo: los mirrors
 * gratuitos limitan concurrencia y dos consultas simultáneas se tumban).
 * Si se acaba el presupuesto de tiempo, corta y devuelve lo conseguido.
 */
export async function fetchOsmCities(cities: OsmCity[], deadline?: number): Promise<OsmBusiness[]> {
  const all: OsmBusiness[] = [];
  for (const city of cities.slice(0, 3)) {
    if (deadline && Date.now() > deadline) break;
    const remaining = deadline ? deadline - Date.now() : TIMEOUT_MS * 2;
    if (remaining < 5000) break;
    const found = await fetchOsmCity(city, {
      timeoutMs: Math.min(16000, remaining - 1000),
      attempts: 2,
    });
    all.push(...found);
  }
  return all;
}
