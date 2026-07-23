import { getSiteConfig } from "@/lib/site-config";
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

  return (
    <>
      <Hero config={config} />
      <Projects />
      <Services config={config} />
      <Testimonials />
      <TechStack />
      <About config={config} />
      <Contact config={config} />
    </>
  );
}
