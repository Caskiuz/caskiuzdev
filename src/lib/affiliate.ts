/**
 * Dominio de la red de afiliados: niveles, comisiones, validación de wallets
 * y constantes de negocio.
 */

export type TierKey = "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export const TIERS: {
  key: TierKey;
  name: string;
  minRevenue: number;
  rate: number;
  emoji: string;
  description: string;
}[] = [
  {
    key: "SILVER",
    name: "Plata",
    minRevenue: 0,
    rate: 0.1,
    emoji: "🥈",
    description: "Punto de partida gratis para todos los afiliados.",
  },
  {
    key: "GOLD",
    name: "Oro",
    minRevenue: 2000,
    rate: 0.2,
    emoji: "🥇",
    description: "Al superar $2,000 USD en ventas referidas cobradas.",
  },
  {
    key: "PLATINUM",
    name: "Platino",
    minRevenue: 5000,
    rate: 0.3,
    emoji: "💎",
    description: "Al superar $5,000 USD en ventas referidas cobradas.",
  },
  {
    key: "DIAMOND",
    name: "Diamante",
    minRevenue: 15000,
    rate: 0.4,
    emoji: "👑",
    description: "Al superar $15,000 USD en ventas referidas cobradas.",
  },
];

export function getTierByRevenue(revenue: number) {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (revenue >= tier.minRevenue) current = tier;
  }
  return current;
}

export function getTierInfo(key: string) {
  return TIERS.find((t) => t.key === key) ?? TIERS[0];
}

export function nextTier(revenue: number) {
  return TIERS.find((t) => t.minRevenue > revenue) ?? null;
}

// ─── Constantes de negocio ───
export const MIN_WITHDRAWAL = 30; // USD
export const REFERRAL_COOKIE = "cask_ref";
export const REFERRAL_COOKIE_DAYS = 30;

/** Lista de países del registro y del perfil (el país habilita métodos de pago locales) */
export const COUNTRIES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba",
  "Ecuador", "El Salvador", "España", "Estados Unidos", "Guatemala",
  "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú",
  "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Otro",
] as const;

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Código de referido ───
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I

export function generateReferralCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Cookie legible (JS) con el código del afiliado para enriquecer mensajes de WhatsApp */
export const REFERRAL_CODE_COOKIE = "cask_ref_code";

/**
 * Convierte un nombre en un slug de link: minúsculas, sin acentos,
 * espacios y símbolos → guiones. Ej: "Ricardo Agelvis" → "ricardo-agelvis".
 * Retorna "" si el nombre no produce caracteres válidos.
 */
export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 40);
}

/** Link de referido público (prefiere el slug bonito, cae al código) */
export function affiliateRef(slug: string | null, referralCode: string): string {
  return slug || referralCode;
}

// ─── Redes y monedas soportadas ───
export const SUPPORTED_CURRENCIES = [
  { code: "USDT", label: "USDT (Tether)", networks: ["TRC20", "ERC20", "BEP20", "SOLANA", "POLYGON", "ARBITRUM"] },
  { code: "USDC", label: "USDC (USD Coin)", networks: ["TRC20", "ERC20", "BEP20", "SOLANA", "POLYGON", "ARBITRUM"] },
  { code: "BTC", label: "Bitcoin (BTC)", networks: ["BITCOIN"] },
] as const;

export const NETWORK_LABELS: Record<string, string> = {
  TRC20: "Tron (TRC-20)",
  ERC20: "Ethereum (ERC-20)",
  BEP20: "BNB Smart Chain (BEP-20)",
  SOLANA: "Solana",
  POLYGON: "Polygon",
  ARBITRUM: "Arbitrum",
  BITCOIN: "Bitcoin",
};

/**
 * Validación de formato de dirección por red.
 * No confirma existencia on-chain; evita errores de tipeo y red incorrecta.
 */
export function validateWalletAddress(network: string, address: string): boolean {
  const addr = address.trim();
  if (!addr || addr.length < 25 || addr.length > 70) return false;

  switch (network) {
    case "TRC20":
      // base58 de 34 chars que empieza con T
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
    case "ERC20":
    case "BEP20":
    case "POLYGON":
    case "ARBITRUM":
      return /^0x[a-fA-F0-9]{40}$/.test(addr);
    case "SOLANA":
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
    case "BITCOIN":
      return /^(1|3)[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(addr) || /^bc1[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr);
    default:
      return false;
  }
}

export function validateBinancePayInput(type: string, value: string): boolean {
  if (type === "BINANCE_ID") return /^\d{6,12}$/.test(value.trim());
  if (type === "BINANCE_EMAIL") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  return false;
}

// ─── Métodos de pago locales (Colombia / EE. UU.) ───
export const COLOMBIA_METHOD_TYPES = ["NEQUI", "DAVIPLATA", "BANCOLOMBIA"] as const;

export function isColombianPayoutType(type: string): boolean {
  return (COLOMBIA_METHOD_TYPES as readonly string[]).includes(type);
}

export const BANCOLOMBIA_ACCOUNT_TYPES = ["Ahorros", "Corriente"] as const;

/**
 * Teléfono móvil colombiano: 10 dígitos que empiezan por 3.
 * Acepta +57, espacios y guiones; devuelve solo dígitos o null si es inválido.
 */
export function normalizeColombianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("57") ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(local) ? local : null;
}

/** Cuenta bancaria colombiana (Bancolombia): 8–17 dígitos */
export function normalizeBancolombiaAccount(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "");
  return /^\d{8,17}$/.test(digits) ? digits : null;
}

/**
 * Cuenta Zelle: email válido o teléfono de EE. UU. (10 dígitos, opcional +1).
 * Devuelve el valor normalizado (email en minúsculas o teléfono a 10 dígitos).
 */
export function normalizeZelleAccount(value: string): string | null {
  const trimmed = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^\d{10}$/.test(local) ? local : null;
}

// ─── Formateo único de métodos de pago (panel, admin y emails) ───
export interface PayoutMethodLike {
  type: string;
  currency?: string | null;
  network?: string | null;
  address?: string | null;
  binanceId?: string | null;
  binanceEmail?: string | null;
  pagoMovilPhone?: string | null;
  pagoMovilBank?: string | null;
  pagoMovilHolder?: string | null;
  pagoMovilId?: string | null;
  accountData?: unknown;
}

export interface LocalAccountData {
  phone?: string;
  holder?: string;
  accountType?: string;
  accountNumber?: string;
  account?: string;
}

export function readAccountData(value: unknown): LocalAccountData {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as LocalAccountData;
  }
  return {};
}

/** Etiqueta corta del método (selector de retiro y listas del panel). */
export function payoutMethodLabel(m: PayoutMethodLike): string {
  const acc = readAccountData(m.accountData);
  switch (m.type) {
    case "BINANCE_PAY":
      return `Binance Pay — ${m.binanceId || m.binanceEmail}`;
    case "PAGO_MOVIL":
      return `Pago Móvil — ${m.pagoMovilPhone} (${m.pagoMovilBank})`;
    case "NEQUI":
      return `Nequi — ${acc.phone}`;
    case "DAVIPLATA":
      return `Daviplata — ${acc.phone}`;
    case "BANCOLOMBIA":
      return `Bancolombia — ${acc.accountType} ${acc.accountNumber}`;
    case "ZELLE":
      return `Zelle — ${acc.account}`;
    default:
      return `${m.currency} (${NETWORK_LABELS[m.network ?? ""] ?? m.network}) — ${m.address?.slice(0, 12)}…`;
  }
}

/** Nombre corto del método (historial de retiros, badges). */
export function payoutMethodShortName(m: PayoutMethodLike): string {
  switch (m.type) {
    case "BINANCE_PAY":
      return "Binance Pay";
    case "PAGO_MOVIL":
      return "Pago Móvil (bolívares)";
    case "NEQUI":
      return "Nequi (pesos)";
    case "DAVIPLATA":
      return "Daviplata (pesos)";
    case "BANCOLOMBIA":
      return "Bancolombia (pesos)";
    case "ZELLE":
      return "Zelle (USD)";
    default:
      return `${m.currency} ${m.network}`;
  }
}

/** Detalle completo del método (panel del admin y emails de retiro). */
export function payoutMethodDetail(m: PayoutMethodLike): string {
  const acc = readAccountData(m.accountData);
  switch (m.type) {
    case "BINANCE_PAY":
      return `Binance Pay — ${m.binanceId || m.binanceEmail}`;
    case "PAGO_MOVIL":
      return `Pago Móvil (BOLÍVARES) — ${m.pagoMovilPhone} · ${m.pagoMovilBank} · ${m.pagoMovilHolder} · ${m.pagoMovilId}`;
    case "NEQUI":
      return `Nequi (COP) — ${acc.phone} · ${acc.holder}`;
    case "DAVIPLATA":
      return `Daviplata (COP) — ${acc.phone} · ${acc.holder}`;
    case "BANCOLOMBIA":
      return `Bancolombia (COP) — Cuenta ${acc.accountType} ${acc.accountNumber} · ${acc.holder}`;
    case "ZELLE":
      return `Zelle (USD) — ${acc.account} · ${acc.holder}`;
    default:
      return `${m.currency} (${m.network}) — ${m.address}`;
  }
}
