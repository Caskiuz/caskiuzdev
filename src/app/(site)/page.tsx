import { getSiteConfig } from "@/lib/site-config";
import { getActiveClientPaymentMethods, stripPaymentSecrets } from "@/lib/payments";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Services } from "@/components/sections/services";
import { Testimonials } from "@/components/sections/testimonials";
import { TechStack } from "@/components/sections/tech-stack";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getSiteConfig();
  // Los componentes de cliente reciben la configuración sin las cuentas de
  // cobro: todo lo que se les pasa queda serializado en el HTML público.
  const publicConfig = stripPaymentSecrets(config);
  const paymentMethods = getActiveClientPaymentMethods(config);

  return (
    <>
      <Hero config={publicConfig} />
      <Projects />
      <Services config={publicConfig} paymentMethods={paymentMethods} />
      <Testimonials />
      <TechStack />
      <About config={publicConfig} />
      <Contact config={publicConfig} />
    </>
  );
}
