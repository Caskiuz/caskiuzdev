import { getSiteConfig } from "@/lib/site-config";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const dynamic = "force-dynamic";

const fields = [
  { key: "affiliates_telegram_url", label: "Link del grupo de Telegram", type: "url" as const, placeholder: "https://t.me/+..." },
  { key: "affiliates_zoom_url", label: "Link de la sala de Zoom (opcional)", type: "url" as const, placeholder: "https://zoom.us/j/... (déjalo vacío si aún no hay sala)" },
];

export default async function AffiliatesSettingsPage() {
  const config = await getSiteConfig();
  return (
    <SettingsEditor
      group="affiliates"
      title="Red de Afiliados"
      description="Enlaces de la comunidad que se muestran en el panel del afiliado (dashboard y Ayuda). El link de la sala de Zoom es opcional: si lo dejas vacío, en su lugar se muestra «Próximamente»."
      fields={fields}
      initialData={config}
    />
  );
}
