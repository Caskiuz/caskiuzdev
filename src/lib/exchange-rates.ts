/**
 * Tasas de cambio automáticas para pagar comisiones de afiliados.
 *
 * - USD → Bs: promedio del mercado paralelo venezolano (ve.dolarapi), con
 *   respaldo en el promedio P2P de Binance que publica alcambio.app y luego
 *   en open.er-api.
 * - USD → COP: TRM oficial de Colombia publicada por dolar-colombia.com, con
 *   respaldo en el dataset oficial de datos.gov.co y luego en open.er-api.
 *
 * Los valores se guardan en site_config (payments_usd_ves_rate y
 * payments_usd_cop_rate, con metadatos _source y _date) para que el resto
 * del sistema los lea igual que siempre (getUsdVesRate / getUsdCopRate).
 */
import { getSiteConfig, upsertConfigs } from "@/lib/site-config";

export interface RateInfo {
  rate: number;
  source: string;
  date: string | null; // ISO
}

export interface RateRefreshResult {
  ok: boolean;
  rate: number | null;
  source: string | null;
  date: string | null;
  error: string | null;
}

export interface StoredRateMeta {
  rate: number | null;
  source: string | null;
  date: string | null;
  stale: boolean;
}

export const RATE_CONFIG_KEYS = {
  ves: {
    rate: "payments_usd_ves_rate",
    source: "payments_usd_ves_rate_source",
    date: "payments_usd_ves_rate_date",
  },
  cop: {
    rate: "payments_usd_cop_rate",
    source: "payments_usd_cop_rate_source",
    date: "payments_usd_cop_rate_date",
  },
} as const;

const FETCH_TIMEOUT_MS = 10_000;
const STALE_MS = 12 * 60 * 60 * 1000;
const ENSURE_WAIT_MS = 7_000;

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Rango de valores plausibles por moneda (para elegir bien el separador decimal) */
const RATE_RANGES = { ves: { min: 10, max: 1_000_000 }, cop: { min: 500, max: 100_000 } };

/**
 * Convierte textos de tasa con separadores ambiguos ("3,306.86", "3306,86",
 * "963.988209") al número correcto, validando que caiga en un rango plausible.
 */
function parseRate(raw: unknown, range: { min: number; max: number }): number {
  const s = String(raw ?? "").trim();
  if (!s) return NaN;
  const candidates = [
    Number(s.replaceAll(".", "").replace(",", ".")), // miles con punto, decimal con coma
    Number(s.replaceAll(",", "")), // miles con coma, decimal con punto
    Number(s), // número directo
  ];
  for (const n of candidates) {
    if (Number.isFinite(n) && n >= range.min && n <= range.max) return n;
  }
  return NaN;
}

// ─── USD → Bs (paralelo, promedio) ───

async function fetchVesFromDolarApi(): Promise<RateInfo> {
  const data = (await fetchJson(
    process.env.RATES_VES_URL || "https://ve.dolarapi.com/v1/dolares/paralelo"
  )) as {
    promedio?: number;
    fechaActualizacion?: string;
  };
  const rate = Number(data?.promedio);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Sin tasa paralela");
  return {
    rate,
    source: "Promedio paralelo (monitores)",
    date: data.fechaActualizacion ?? null,
  };
}

async function fetchVesFromAlcambioP2P(): Promise<RateInfo> {
  const data = (await fetchJson("https://api.alcambio.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operationName: "getBinanceP2PAverages",
      variables: {},
      query: "query getBinanceP2PAverages { getBinanceP2PAverages { sellAverage buyAverage updatedAt } }",
    }),
  })) as {
    data?: { getBinanceP2PAverages?: { sellAverage?: number; buyAverage?: number; updatedAt?: number } };
  };
  const p2p = data?.data?.getBinanceP2PAverages;
  const rate =
    p2p && Number.isFinite(p2p.sellAverage) && Number.isFinite(p2p.buyAverage)
      ? ((p2p.sellAverage ?? 0) + (p2p.buyAverage ?? 0)) / 2
      : NaN;
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Sin promedio P2P");
  return {
    rate,
    source: "P2P Binance (alcambio.app)",
    date: p2p?.updatedAt ? new Date(p2p.updatedAt).toISOString() : null,
  };
}

async function fetchVesFromOpenErApi(): Promise<RateInfo> {
  const data = (await fetchJson("https://open.er-api.com/v6/latest/USD")) as {
    rates?: { VES?: number };
    time_last_update_utc?: string;
  };
  const rate = Number(data?.rates?.VES);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Sin tasa VES");
  return { rate, source: "open.er-api (referencia)", date: data.time_last_update_utc ?? null };
}

export async function fetchLiveVesRate(): Promise<RateInfo | null> {
  for (const attempt of [fetchVesFromDolarApi, fetchVesFromAlcambioP2P, fetchVesFromOpenErApi]) {
    try {
      return await attempt();
    } catch {
      // probar el siguiente respaldo
    }
  }
  return null;
}

// ─── USD → COP (TRM) ───

async function fetchCopFromDolarColombia(): Promise<RateInfo> {
  const url = process.env.RATES_COP_URL || "https://www.dolar-colombia.com/";
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // 1) JSON-LD embebido (estructura ExchangeRateSpecification)
  const ldBlocks = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  if (ldBlocks) {
    for (const block of ldBlocks) {
      try {
        const json = JSON.parse(block.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""));
        const price = json?.mainEntity?.itemListElement?.[0]?.currentExchangeRate?.price;
        const rate = parseRate(price, RATE_RANGES.cop);
        if (Number.isFinite(rate)) return { rate, source: "TRM (dolar-colombia.com)", date: null };
      } catch {
        // siguiente bloque
      }
    }
  }

  // 2) Span con la clase exchange-rate
  const spanMatch = html.match(/<span class="exchange-rate[^"]*">([^<]+)<\/span>/);
  const rate = spanMatch ? parseRate(spanMatch[1], RATE_RANGES.cop) : NaN;
  if (Number.isFinite(rate)) return { rate, source: "TRM (dolar-colombia.com)", date: null };

  throw new Error("TRM no encontrada en la página");
}

async function fetchCopFromDatosGov(): Promise<RateInfo> {
  const data = (await fetchJson(
    "https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1"
  )) as { valor?: string; vigenciadesde?: string }[];
  const record = Array.isArray(data) ? data[0] : undefined;
  const rate = parseRate(record?.valor, RATE_RANGES.cop);
  if (!Number.isFinite(rate)) throw new Error("Sin TRM en datos.gov.co");
  return { rate, source: "TRM (datos.gov.co)", date: record?.vigenciadesde ?? null };
}

async function fetchCopFromOpenErApi(): Promise<RateInfo> {
  const data = (await fetchJson("https://open.er-api.com/v6/latest/USD")) as {
    rates?: { COP?: number };
    time_last_update_utc?: string;
  };
  const rate = Number(data?.rates?.COP);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Sin tasa COP");
  return { rate, source: "open.er-api (referencia)", date: data.time_last_update_utc ?? null };
}

export async function fetchLiveCopRate(): Promise<RateInfo | null> {
  for (const attempt of [fetchCopFromDolarColombia, fetchCopFromDatosGov, fetchCopFromOpenErApi]) {
    try {
      return await attempt();
    } catch {
      // probar el siguiente respaldo
    }
  }
  return null;
}

// ─── Persistencia y lectura ───

function toResult(info: RateInfo | null): RateRefreshResult {
  if (!info) return { ok: false, rate: null, source: null, date: null, error: "Sin fuentes disponibles" };
  return { ok: true, rate: info.rate, source: info.source, date: info.date, error: null };
}

/**
 * Descarga ambas tasas en paralelo y guarda en site_config solo las que
 * tuvieron éxito (el valor anterior queda como respaldo si una falla).
 */
export async function refreshStoredRates(): Promise<{ ves: RateRefreshResult; cop: RateRefreshResult }> {
  const [ves, cop] = await Promise.all([fetchLiveVesRate(), fetchLiveCopRate()]);
  const vesResult = toResult(ves);
  const copResult = toResult(cop);

  const entries: { key: string; value: string; group: string }[] = [];
  if (vesResult.ok && vesResult.rate !== null) {
    entries.push(
      { key: RATE_CONFIG_KEYS.ves.rate, value: String(vesResult.rate), group: "payments" },
      { key: RATE_CONFIG_KEYS.ves.source, value: vesResult.source ?? "", group: "payments" },
      { key: RATE_CONFIG_KEYS.ves.date, value: vesResult.date ?? new Date().toISOString(), group: "payments" }
    );
  }
  if (copResult.ok && copResult.rate !== null) {
    entries.push(
      { key: RATE_CONFIG_KEYS.cop.rate, value: String(copResult.rate), group: "payments" },
      { key: RATE_CONFIG_KEYS.cop.source, value: copResult.source ?? "", group: "payments" },
      { key: RATE_CONFIG_KEYS.cop.date, value: copResult.date ?? new Date().toISOString(), group: "payments" }
    );
  }
  if (entries.length > 0) await upsertConfigs(entries);

  return { ves: vesResult, cop: copResult };
}

/** Lee la tasa guardada en la configuración con su fuente y fecha. */
export function readStoredRate(
  config: Record<string, string>,
  kind: "ves" | "cop"
): StoredRateMeta {
  const keys = RATE_CONFIG_KEYS[kind];
  const rate = parseRate(config[keys.rate], RATE_RANGES[kind]);
  const source = config[keys.source] || null;
  const date = config[keys.date] || null;
  const parsedDate = date ? Date.parse(date) : NaN;
  const stale = !date || !Number.isFinite(parsedDate) || Date.now() - parsedDate > STALE_MS;
  return { rate: Number.isFinite(rate) ? rate : null, source, date, stale };
}

/**
 * Refresca las tasas si el dato guardado tiene más de 12 horas. Espera como
 * máximo ENSURE_WAIT_MS para no colgar la página (el refresco sigue en
 * segundo plano). Nunca lanza errores: el valor guardado queda de respaldo.
 */
export async function ensureFreshRates(maxWaitMs: number = ENSURE_WAIT_MS): Promise<void> {
  try {
    const config = await getSiteConfig();
    const ves = readStoredRate(config, "ves");
    const cop = readStoredRate(config, "cop");
    if (!ves.stale && !cop.stale) return;
    await Promise.race([
      refreshStoredRates(),
      new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
    ]);
  } catch {
    // la página sigue con el dato guardado
  }
}
