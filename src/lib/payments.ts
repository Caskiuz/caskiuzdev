/**
 * Métodos de pago que el DUEÑO del sitio acepta de los CLIENTES
 * (configurables en el admin → Ajustes → Métodos de pago):
 * Zelle, PayPal, Binance, Western Union y envíos cripto a wallets
 * USDT/USDC/BTC.
 *
 * El Pago Móvil NO es método de clientes: es un método de COBRO de
 * comisiones exclusivo de los afiliados en Venezuela (se configura en
 * el panel del afiliado, sección Retiros).
 */

export interface PaymentMethodInfo {
  id: string;
  label: string;
  /** Datos públicos del método (solo si el dueño los configuró) */
  detail: string | null;
}

const WALLET_FIELDS: [string, string][] = [
  ["USDT (TRC20)", "payments_wallet_usdt_trc20"],
  ["USDT (BEP20)", "payments_wallet_usdt_bep20"],
  ["USDC (TRC20)", "payments_wallet_usdc_trc20"],
  ["Bitcoin", "payments_wallet_btc"],
];

function readWallets(config: Record<string, string>): string[] {
  const wallets: string[] = [];
  for (const [label, key] of WALLET_FIELDS) {
    const address = (config[key] || "").trim();
    if (address) wallets.push(`${label}: ${address}`);
  }
  const extra = (config["payments_wallet_extra"] || "").trim();
  if (extra) {
    extra
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => wallets.push(line));
  }
  return wallets;
}

/**
 * Lista de métodos de pago de clientes que acepta Caskiuz.
 * Los que tienen datos configurados incluyen el detalle público.
 */
export function getClientPaymentMethods(
  config: Record<string, string>
): PaymentMethodInfo[] {
  const zelle = (config["payments_zelle"] || "").trim();
  const paypal = (config["payments_paypal"] || "").trim();
  const binance = (config["payments_binance"] || "").trim();
  const wuName = (config["payments_western_union_name"] || "").trim();
  const wuCountry = (config["payments_western_union_country"] || "").trim();
  const wallets = readWallets(config);

  return [
    { id: "zelle", label: "Zelle", detail: zelle || null },
    { id: "paypal", label: "PayPal", detail: paypal || null },
    { id: "binance", label: "Binance", detail: binance || null },
    {
      id: "western-union",
      label: "Western Union",
      detail: wuName ? `${wuName}${wuCountry ? ` · ${wuCountry}` : ""}` : null,
    },
    {
      id: "crypto",
      label: "Cripto (USDT · USDC · BTC)",
      detail: wallets.length > 0 ? wallets.join("  ·  ") : null,
    },
  ];
}

/**
 * Tasa de cambio USD → Bs configurada por el dueño para pagar las
 * comisiones de afiliados venezolanos por Pago Móvil.
 * Retorna null si no está configurada.
 */
export function getUsdVesRate(config: Record<string, string>): number | null {
  const raw = (config["payments_usd_ves_rate"] || "").trim().replace(",", ".");
  const rate = Number(raw);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export function formatVes(amount: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
