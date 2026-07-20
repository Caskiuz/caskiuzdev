import { getSiteConfig } from "@/lib/site-config";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const dynamic = "force-dynamic";

const fields = [
  { key: "social_github_url", label: "URL de GitHub", type: "url" as const, placeholder: "https://github.com/caskiuz" },
  { key: "social_github_label", label: "Texto de GitHub", placeholder: "GitHub" },
  { key: "social_linkedin_url", label: "URL de LinkedIn", type: "url" as const, placeholder: "https://www.linkedin.com/in/..." },
  { key: "social_linkedin_label", label: "Texto de LinkedIn", placeholder: "LinkedIn" },
  { key: "social_twitter_url", label: "URL de Twitter/X", type: "url" as const, placeholder: "https://x.com/..." },
  { key: "social_twitter_label", label: "Texto de Twitter/X", placeholder: "Twitter" },
  { key: "social_youtube_url", label: "URL de YouTube", type: "url" as const, placeholder: "https://youtube.com/@..." },
  { key: "social_youtube_label", label: "Texto de YouTube", placeholder: "YouTube" },
  { key: "social_instagram_url", label: "URL de Instagram", type: "url" as const, placeholder: "https://instagram.com/..." },
  { key: "social_instagram_label", label: "Texto de Instagram", placeholder: "Instagram" },
  { key: "footer_copyright", label: "Copyright del footer", placeholder: "© 2024 Caskiuz. Todos los derechos reservados." },
  { key: "footer_built_with", label: "Línea 'Built with' del footer", placeholder: "Built with Next.js, TailwindCSS & ❤️" },
];

export default async function SocialSettingsPage() {
  const config = await getSiteConfig();
  return (
    <SettingsEditor
      group="social"
      title="Redes Sociales & Footer"
      description="Edita los enlaces a redes sociales y el texto del footer."
      fields={fields}
      initialData={config}
    />
  );
}