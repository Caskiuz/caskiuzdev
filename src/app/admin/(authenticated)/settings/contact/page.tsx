import { getSiteConfig } from "@/lib/site-config";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const dynamic = "force-dynamic";

const fields = [
  { key: "contact_label", label: "Etiqueta superior", placeholder: "Contacto" },
  { key: "contact_title", label: "Título de la sección", placeholder: "¿Listo para empezar?" },
  { key: "contact_subtitle", label: "Subtítulo", type: "textarea" as const, placeholder: "Cuéntame sobre tu proyecto..." },
  { key: "contact_email", label: "Email de contacto", type: "email" as const, placeholder: "rijarwow@gmail.com" },
  { key: "contact_whatsapp", label: "Número de WhatsApp (con prefijo)", placeholder: "584262931869" },
  { key: "contact_whatsapp_message", label: "Mensaje predefinido de WhatsApp", type: "textarea" as const, placeholder: "¡Hola Caskiuz! 👋 Me gustaría conversar sobre un proyecto." },
  { key: "contact_linkedin_url", label: "URL de LinkedIn", type: "url" as const, placeholder: "https://www.linkedin.com/in/..." },
  { key: "contact_linkedin_label", label: "Texto de LinkedIn", placeholder: "Conecta conmigo" },
  { key: "contact_location", label: "Texto de ubicación", placeholder: "Remoto — Trabajo con clientes de todo el mundo" },
  { key: "contact_availability", label: "Horario de disponibilidad", placeholder: "Lunes a Viernes, 9AM - 6PM (GMT-4)" },
  { key: "contact_whatsapp_card_title", label: "Título tarjeta WhatsApp", placeholder: "WhatsApp Directo" },
  { key: "contact_whatsapp_card_subtitle", label: "Subtítulo tarjeta WhatsApp", placeholder: "Respuesta en minutos" },
  { key: "contact_email_card_subtitle", label: "Subtítulo tarjeta Email (muestra el email)", placeholder: "" },
];

export default async function ContactSettingsPage() {
  const config = await getSiteConfig();
  return (
    <SettingsEditor
      group="contact"
      title="Contacto"
      description="Edita el email, WhatsApp, LinkedIn, ubicación y horarios."
      fields={fields}
      initialData={config}
    />
  );
}