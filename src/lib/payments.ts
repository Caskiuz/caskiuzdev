/**
 * Métodos de pago que el DUEÑO del sitio acepta de los CLIENTES.
 * Configurables desde el admin (Ajustes → Métodos de pago):
 * Pago Móvil (Venezuela), Zelle, PayPal, Binance, Western Union y
 * envíos cripto a wallets USDT/USDC/BTC.
 */

export interface PagoMovilInfo {
  enabled: boolean;
  phone: string;
  bank: string;
  holder: string;
  id: string;
}

export function getPagoMovil(config: Record<string, string>): PagoMovilInfo {
  const phone = (config["payments_pago_movil_phone"] || "").trim();
  return {
    enabled: Boolean(phone),
    phone,
    bank: (config["payments_pago_movil_bank"] || "").trim(),
    holder: (config["payments_pago_movil_holder"] || "").trim(),
    id: (config["payments_pago_movil_id"] || "").trim(),
  };
}

export function formatPagoMovil(info: PagoMovilInfo): string {
  const parts = [info.phone, info.bank, info.holder, info.id].filter(Boolean);
  return parts.join(" · ");
}

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
  // Otras redes en texto libre (una por línea)
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
 * Lista completa de métodos de pago de clientes que acepta Caskiuz.
 * Todos aparecen siempre; los que tienen datos configurados incluyen
 * el detalle para que afiliados y clientes sepan cómo pagar.
 */
export function getClientPaymentMethods(
  config: Record<string, string>
): PaymentMethodInfo[] {
  const pagoMovil = getPagoMovil(config);
  const zelle = (config["payments_zelle"] || "").trim();
  const paypal = (config["payments_paypal"] || "").trim();
  const binance = (config["payments_binance"] || "").trim();
  const wuName = (config["payments_western_union_name"] || "").trim();
  const wuCountry = (config["payments_western_union_country"] || "").trim();
  const wallets = readWallets(config);

  return [
    {
      id: "pago-movil",
      label: "Pago Móvil (Venezuela)",
      detail: pagoMovil.enabled ? formatPagoMovil(pagoMovil) : null,
    },
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
