import { getSiteConfig } from "@/lib/site-config";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const dynamic = "force-dynamic";

const fields = [
  { key: "about_label", label: "Etiqueta superior", placeholder: "Sobre mí" },
  { key: "about_title", label: "Título de la sección", placeholder: "Mi historia" },
  { key: "about_bio_title", label: "Título de la bio", placeholder: "Más allá del código" },
  { key: "about_bio_p1", label: "Bio - Párrafo 1", type: "textarea" as const, placeholder: "Soy un desarrollador full-stack..." },
  { key: "about_bio_p2", label: "Bio - Párrafo 2", type: "textarea" as const, placeholder: "Me especializo en el ecosistema..." },
  { key: "about_quick_location_label", label: "Quick fact - Ubicación label", placeholder: "Ubicación" },
  { key: "about_quick_location_value", label: "Quick fact - Ubicación valor", placeholder: "Remoto Global" },
  { key: "about_quick_avail_label", label: "Quick fact - Disponibilidad label", placeholder: "Disponible" },
  { key: "about_quick_avail_value", label: "Quick fact - Disponibilidad valor", placeholder: "Full-Time" },
  // Timeline items
  { key: "about_tl_1_year", label: "Timeline 1 - Año", placeholder: "2024 — Presente" },
  { key: "about_tl_1_title", label: "Timeline 1 - Título", placeholder: "Senior Full-Stack Developer" },
  { key: "about_tl_1_company", label: "Timeline 1 - Empresa", placeholder: "Freelance Internacional" },
  { key: "about_tl_1_desc", label: "Timeline 1 - Descripción", type: "textarea" as const, placeholder: "Desarrollo de aplicaciones web..." },
  { key: "about_tl_2_year", label: "Timeline 2 - Año", placeholder: "2022 — 2024" },
  { key: "about_tl_2_title", label: "Timeline 2 - Título", placeholder: "Full-Stack Developer" },
  { key: "about_tl_2_company", label: "Timeline 2 - Empresa", placeholder: "Agencia Digital TechCo" },
  { key: "about_tl_2_desc", label: "Timeline 2 - Descripción", type: "textarea" as const, placeholder: "Lideré el equipo de frontend..." },
  { key: "about_tl_3_year", label: "Timeline 3 - Año", placeholder: "2020 — 2022" },
  { key: "about_tl_3_title", label: "Timeline 3 - Título", placeholder: "Backend Developer" },
  { key: "about_tl_3_company", label: "Timeline 3 - Empresa", placeholder: "Startup Fintech" },
  { key: "about_tl_3_desc", label: "Timeline 3 - Descripción", type: "textarea" as const, placeholder: "Diseñé e implementé APIs..." },
];

export default async function AboutSettingsPage() {
  const config = await getSiteConfig();
  return (
    <SettingsEditor
      group="about"
      title="About / Sobre mí"
      description="Edita la sección de historia, bio y experiencia laboral."
      fields={fields}
      initialData={config}
    />
  );
}