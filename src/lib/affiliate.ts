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
export const COMMISSION_HOLD_DAYS = 30; // ventana de reembolsos tras cobro total
export const REFERRAL_COOKIE = "cask_ref";
export const REFERRAL_COOKIE_DAYS = 30;

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
