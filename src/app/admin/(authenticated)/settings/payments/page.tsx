import { getSiteConfig } from "@/lib/site-config";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const dynamic = "force-dynamic";

const fields = [
  {
    key: "payments_pago_movil_phone",
    label: "Pago Móvil — Teléfono (formato 04XX-XXXXXXX)",
    placeholder: "0412-1234567",
  },
  {
    key: "payments_pago_movil_bank",
    label: "Pago Móvil — Banco",
    placeholder: "Banco de Venezuela (0102)",
  },
  {
    key: "payments_pago_movil_holder",
    label: "Pago Móvil — Titular",
    placeholder: "Ricardo Agelvis",
  },
  {
    key: "payments_pago_movil_id",
    label: "Pago Móvil — Cédula / RIF",
    placeholder: "V-12345678",
  },
];

export default async function PaymentsSettingsPage() {
  const config = await getSiteConfig();
  return (
    <SettingsEditor
      group="payments"
      title="Métodos de pago"
      description="Configura los datos de Pago Móvil Venezuela para que tus clientes (y los afiliados que te traen clientes) sepan cómo pagar. Se muestran solo si el teléfono está configurado; si lo dejas vacío, el método no aparece en la web."
      fields={fields}
      initialData={config}
    />
  );
}
