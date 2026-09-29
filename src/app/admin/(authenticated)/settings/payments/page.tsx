import { getSiteConfig } from "@/lib/site-config";
import { ensureFreshRates } from "@/lib/exchange-rates";
import { SettingsEditor } from "@/components/admin/settings-editor";
import { AutoRatesPanel } from "@/components/admin/auto-rates-panel";

export const dynamic = "force-dynamic";

const fields = [
  // ─── Métodos internacionales (clientes) ───
  {
    key: "payments_zelle",
    label: "🇺🇸 Zelle — Email o teléfono registrado",
    placeholder: "tucorreo@gmail.com",
  },
  {
    key: "payments_paypal",
    label: "🅿️ PayPal — Email de cobro",
    placeholder: "tucorreo@paypal.com",
  },
  {
    key: "payments_binance",
    label: "🟡 Binance — Binance ID o email",
    placeholder: "123456789 o tucorreo@gmail.com",
  },
  {
    key: "payments_western_union_name",
    label: "🌎 Western Union — Nombre del titular",
    placeholder: "RICARDO AGELVIS",
  },
  {
    key: "payments_western_union_country",
    label: "🌎 Western Union — País de cobro",
    placeholder: "Venezuela",
  },
  // ─── Wallets cripto ───
  {
    key: "payments_wallet_usdt_trc20",
    label: "💰 Wallet USDT — Red Tron (TRC20)",
    placeholder: "T…",
  },
  {
    key: "payments_wallet_usdt_bep20",
    label: "💰 Wallet USDT — BNB Smart Chain (BEP20)",
    placeholder: "0x…",
  },
  {
    key: "payments_wallet_usdc_trc20",
    label: "💰 Wallet USDC — Red Tron (TRC20)",
    placeholder: "T…",
  },
  {
    key: "payments_wallet_btc",
    label: "₿ Wallet Bitcoin (BTC)",
    placeholder: "bc1…",
  },
  {
    key: "payments_wallet_extra",
    label: "💰 Otras redes o monedas (una por línea, opcional)",
    type: "textarea" as const,
    placeholder: "USDT (ERC20): 0x…\nUSDC (Solana): …",
  },
];

export default async function PaymentsSettingsPage() {
  // Las tasas USD → Bs y USD → COP se actualizan solas (cron + refresco al entrar).
  await ensureFreshRates();
  const config = await getSiteConfig();
  return (
    <SettingsEditor
      group="payments"
      title="Métodos de pago"
      description="Configura los métodos de pago que aceptas de tus CLIENTES: Zelle, PayPal, Binance, Western Union y wallets cripto (USDT/USDC/BTC). Las tasas de cambio para pagar comisiones (USD → Bs paralelo y USD → COP TRM) se actualizan automáticamente desde fuentes públicas; no hay que configurarlas. Los afiliados registran sus propios datos desde su panel. Los datos que dejes en blanco no se muestran en la web."
      fields={fields}
      initialData={config}
      beforeFields={<AutoRatesPanel config={config} />}
    />
  );
}
