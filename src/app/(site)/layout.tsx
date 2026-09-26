import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AiChatWidget } from "@/components/ui/ai-chat-widget";
import { getSiteConfig } from "@/lib/site-config";

/**
 * Layout del sitio público: header, footer y asistente de IA flotante.
 * Los paneles internos (/afiliados/panel, /admin) NO usan este layout,
 * por lo que el navbar público no se solapa con las áreas privadas.
 */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = await getSiteConfig();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer config={config} />
      <AiChatWidget />
    </div>
  );
}
