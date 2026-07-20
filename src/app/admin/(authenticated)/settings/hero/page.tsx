import { getSiteConfig } from "@/lib/site-config";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const dynamic = "force-dynamic";

const fields = [
  { key: "hero_name", label: "Nombre principal", placeholder: "Caskiuz" },
  { key: "hero_title", label: "Título profesional", placeholder: "Full-Stack Developer & Software Architect" },
  { key: "hero_subtitle", label: "Subtítulo / Descripción", type: "textarea" as const, placeholder: "Construyo aplicaciones web y mobile..." },
  { key: "hero_badge", label: "Texto del badge de disponibilidad", placeholder: "Disponible para nuevos proyectos" },
  { key: "hero_cta_primary", label: "Texto del botón principal", placeholder: "¡Trabajemos juntos!" },
  { key: "hero_cta_secondary", label: "Texto del botón secundario", placeholder: "Ver proyectos" },
  { key: "hero_stat_1_value", label: "Stat 1 - Valor", placeholder: "3+" },
  { key: "hero_stat_1_label", label: "Stat 1 - Etiqueta", placeholder: "Años de experiencia" },
  { key: "hero_stat_2_value", label: "Stat 2 - Valor", placeholder: "50+" },
  { key: "hero_stat_2_label", label: "Stat 2 - Etiqueta", placeholder: "Proyectos completados" },
  { key: "hero_stat_3_value", label: "Stat 3 - Valor", placeholder: "30+" },
  { key: "hero_stat_3_label", label: "Stat 3 - Etiqueta", placeholder: "Clientes satisfechos" },
];

export default async function HeroSettingsPage() {
  const config = await getSiteConfig();
  return (
    <SettingsEditor
      group="hero"
      title="Hero"
      description="Edita la sección principal de la página de inicio."
      fields={fields}
      initialData={config}
    />
  );
}