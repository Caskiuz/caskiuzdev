import { getSiteConfig } from "@/lib/site-config";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const dynamic = "force-dynamic";

const fields = [
  // ─── Pago Móvil (Venezuela) ───
  {
    key: "payments_pago_movil_phone",
    label: "📲 Pago Móvil — Teléfono (04XX-XXXXXXX)",
    placeholder: "0412-1234567",
  },
  {
    key: "payments_pago_movil_bank",
    label: "📲 Pago Móvil — Banco",
    placeholder: "Banco de Venezuela (0102)",
  },
  {
    key: "payments_pago_movil_holder",
    label: "📲 Pago Móvil — Titular",
    placeholder: "Ricardo Agelvis",
  },
  {
    key: "payments_pago_movil_id",
    label: "📲 Pago Móvil — Cédula / RIF",
    placeholder: "V-12345678",
  },
  // ─── Métodos internacionales ───
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
  const config = await getSiteConfig();
  return (
    <SettingsEditor
      group="payments"
      title="Métodos de pago"
      description="Configura los métodos de pago que aceptas de tus CLIENTES: Pago Móvil (Venezuela), Zelle, PayPal, Binance, Western Union y wallets cripto (USDT/USDC/BTC). Los datos que dejes en blanco no se muestran en la web. Estos datos aparecen en la página principal, la landing de afiliados y el panel de cada afiliado."
      fields={fields}
      initialData={config}
    />
  );
}
