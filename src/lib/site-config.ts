import { prisma } from "@/lib/prisma/client";

export type ConfigGroup =
  | "hero"
  | "contact"
  | "services"
  | "about"
  | "social"
  | "footer";

export interface SiteConfigRecord {
  key: string;
  value: string;
  group: string;
}

/**
 * Obtiene todas las configuraciones del sitio desde la base de datos.
 * Retorna un mapa vacío si la DB no está disponible.
 */
export async function getSiteConfig(): Promise<Record<string, string>> {
  try {
    const configs = await prisma.siteConfig.findMany();
    const map: Record<string, string> = {};
    for (const c of configs) {
      map[c.key] = c.value;
    }
    return map;
  } catch {
    // DB no disponible o tabla no existe — retornar vacío, el frontend usará fallbacks
    return {};
  }
}

/**
 * Obtiene las configuraciones agrupadas por grupo.
 */
export async function getSiteConfigByGroup(): Promise<Record<string, Record<string, string>>> {
  try {
    const configs = await prisma.siteConfig.findMany();
    const grouped: Record<string, Record<string, string>> = {};
    for (const c of configs) {
      if (!grouped[c.group]) grouped[c.group] = {};
      grouped[c.group][c.key] = c.value;
    }
    return grouped;
  } catch {
    return {};
  }
}

/**
 * Obtiene todas las configuraciones como array (para el admin).
 */
export async function getAllConfigs(): Promise<SiteConfigRecord[]> {
  return prisma.siteConfig.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
}

/**
 * Actualiza una o varias configuraciones. Crea si no existe.
 */
export async function upsertConfigs(
  entries: { key: string; value: string; group: string }[]
): Promise<void> {
  for (const entry of entries) {
    await prisma.siteConfig.upsert({
      where: { key: entry.key },
      update: { value: entry.value, group: entry.group },
      create: { key: entry.key, value: entry.value, group: entry.group },
    });
  }
}