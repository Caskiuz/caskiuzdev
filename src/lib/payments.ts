/**
 * Métodos de pago que acepta Caskiuz para los CLIENTES.
 * El Pago Móvil (Venezuela) es configurable desde el admin
 * (Ajustes → Métodos de pago) y se muestra solo si hay teléfono.
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

/** Métodos de pago de clientes (independientes de las comisiones en cripto) */
export const CLIENT_PAYMENT_METHODS = [
  "Pago Móvil (Venezuela)",
  "Transferencia bancaria",
  "PayPal",
  "Binance",
  "MercadoPago",
];

export function formatPagoMovil(info: PagoMovilInfo): string {
  const parts = [info.phone, info.bank, info.holder, info.id].filter(Boolean);
  return parts.join(" · ");
}
