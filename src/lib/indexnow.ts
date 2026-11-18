/**
 * IndexNow (Bing/Seznam/Naver — gratis, indexa en horas).
 * El ping de Google a /ping?sitemap quedó deprecado (404); Google solo acepta
 * indexación vía Search Console, pero IndexNow cubre el resto de buscadores
 * y notifica cambios de contenido sin esperar el crawl.
 *
 * La clave es determinística (derivada del dominio) y su archivo público
 * vive en public/{key}.txt — no requiere configuración.
 */

import { createHash } from "crypto";

const HOST = "caskiuz.vercel.app";
const BASE_URL = `https://${HOST}`;

export const INDEXNOW_KEY = createHash("sha256")
  .update(`${HOST}|indexnow|caskiuz-2026`)
  .digest("hex")
  .slice(0, 32);

export const INDEXNOW_KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`;

/** Notifica URLs nuevas/actualizadas. Nunca lanza. */
export async function notifyIndexNow(urls: string[]): Promise<boolean> {
  const clean = urls
    .filter((u) => /^https?:\/\//.test(u))
    .slice(0, 100); // límite generoso de IndexNow por request
  if (!clean.length) return false;

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: clean,
      }),
      signal: AbortSignal.timeout(10000),
    });
    // 200 = aceptado, 202 = aceptado para procesamiento posterior
    return res.status === 200 || res.status === 202;
  } catch (error) {
    console.error("Error IndexNow:", error instanceof Error ? error.message : error);
    return false;
  }
}

/** URLs principales del sitio para notificar tras cambios de contenido. */
export function coreSiteUrls(): string[] {
  const slugs = [
    "nextjs-mejor-framework-freelancers",
    "prisma-orm-mysql-guia-completa",
    "arquitectura-limpia-nodejs-apis",
    "10-patrones-react-esenciales",
    "clientes-internacionales-freelance-latino",
  ];
  const landings = [
    "desarrollo-web",
    "automatizacion-ia",
    "redes-sociales",
  ];
  return [
    `${BASE_URL}/`,
    `${BASE_URL}/blog`,
    `${BASE_URL}/afiliados`,
    ...slugs.map((s) => `${BASE_URL}/blog/${s}`),
    ...landings.map((s) => `${BASE_URL}/servicios/${s}`),
  ];
}
