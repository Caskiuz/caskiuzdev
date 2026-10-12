import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AiChatWidget } from "@/components/ui/ai-chat-widget";
import { ReferralCapture } from "@/components/layout/referral-capture";
import { getSiteConfig } from "@/lib/site-config";
import { stripPaymentSecrets } from "@/lib/payments";
import { SiteSession } from "@/components/layout/site-session";

/**
 * Layout del sitio público: header, footer y asistente de IA flotante.
 * Los paneles internos (/afiliados/panel, /admin) NO usan este layout,
 * por lo que el navbar público no se solapa con las áreas privadas.
 *
 * El estado de sesión del top bar se consulta desde el cliente
 * (/api/session) para no volver dinámicas las páginas estáticas (blog).
 */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = await getSiteConfig();
  // El footer es un componente de cliente: recibe la configuración sin las
  // cuentas de cobro (payments_*) para no exponerlas en el HTML.
  const publicConfig = stripPaymentSecrets(config);

  return (
    <div className="flex min-h-screen flex-col">
      <Header sessionSlot={<SiteSession />} />
      <main className="flex-1">{children}</main>
      <Footer config={publicConfig} />
      <AiChatWidget whatsapp={config.contact_whatsapp || "584262931869"} />
      <ReferralCapture />
    </div>
  );
}
