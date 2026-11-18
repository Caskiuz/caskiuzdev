import { prisma } from "@/lib/prisma/client";
import { getSiteConfig } from "@/lib/site-config";
import { getActiveClientPaymentMethods, stripPaymentSecrets } from "@/lib/payments";
import { serviceCatalogSchema, reviewsSchema } from "@/lib/seo-schemas";
import { JsonLd } from "@/components/seo/json-ld";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Services } from "@/components/sections/services";
import { Testimonials } from "@/components/sections/testimonials";
import { TechStack } from "@/components/sections/tech-stack";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";

// ISR 5 min: el config viene cacheado (unstable_cache en site-config) y el
// admin invalida al instante con revalidateTag.
export const revalidate = 300;

export default async function Home() {
  const config = await getSiteConfig();
  // Los componentes de cliente reciben la configuración sin las cuentas de
  // cobro: todo lo que se les pasa queda serializado en el HTML público.
  const publicConfig = stripPaymentSecrets(config);
  const paymentMethods = getActiveClientPaymentMethods(config);

  // Schemas de dinero: catálogo con precios + reseñas aprobadas (jamás inventadas)
  const approved = await prisma.testimonial
    .findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 8 })
    .catch(() => []);

  return (
    <>
      <JsonLd data={serviceCatalogSchema()} />
      {reviewsSchema(
        approved.map((t) => ({
          name: t.name,
          role: t.role,
          company: t.company,
          content: t.content,
          rating: t.rating,
        }))
      ) && (
        <JsonLd
          data={reviewsSchema(
            approved.map((t) => ({
              name: t.name,
              role: t.role,
              company: t.company,
              content: t.content,
              rating: t.rating,
            }))
          )!}
        />
      )}
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
