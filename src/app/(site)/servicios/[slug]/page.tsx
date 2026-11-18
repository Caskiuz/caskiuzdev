import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle, Clock } from "lucide-react";
import { defaultServices, defaultMonthlyPlans, serviceCategories } from "@/lib/services-defaults";
import { JsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://caskiuz.vercel.app";

interface LandingDef {
  categoryKey: string;
  h1: string;
  intro: string;
  description: string;
  keywords: string[];
  faqs: { q: string; a: string }[];
}

const LANDINGS: Record<string, LandingDef> = {
  "desarrollo-web": {
    categoryKey: "desarrollo",
    h1: "Desarrollo de páginas web y apps a medida",
    intro:
      "Webs profesionales desde $149 que venden por ti: landing pages, tiendas online, aplicaciones y APIs robustas. Entrega en días, no meses, con pago 50% / 50%.",
    description:
      "Diseño y desarrollo de páginas web profesionales desde $149 USD: landing pages, web apps, tiendas online y APIs. Freelance full-stack para Venezuela y Latinoamérica. Entrega en 1-2 semanas.",
    keywords: [
      "diseño de paginas web precio",
      "desarrollo web venezuela",
      "crear pagina web para negocio",
      "landing page profesional",
      "desarrollo web apps colombia peru mexico",
    ],
    faqs: [
      {
        q: "¿Cuánto cuesta una página web profesional?",
        a: "En Caskiuz una landing page profesional cuesta desde $149 USD y una aplicación web completa desde $299 USD. La competencia cobra $400-800 por lo mismo. El pago es 50% al iniciar y 50% al entregar, y la entrega toma 1-2 semanas.",
      },
      {
        q: "¿Qué incluye el precio?",
        a: "Diseño responsive (se ve bien en celular y PC), SEO básico para aparecer en Google, formularios de contacto conectados a WhatsApp, hosting y dominio guiado, y entregables documentados.",
      },
      {
        q: "¿Cuánto tarda mi página web?",
        a: "Una landing page: 3-5 días. Una web corporativa o tienda online: 1-3 semanas. Trabajamos con IA para acelerar el desarrollo sin sacrificar calidad.",
      },
      {
        q: "¿Puedo editar el contenido yo mismo después?",
        a: "Sí. Las webs se construyen para que el menú, precios y textos sean editables sin tocar código, y si prefieres, el mantenimiento mensual ($49/mes) lo hace todo por ti.",
      },
    ],
  },
  "automatizacion-ia": {
    categoryKey: "automatizacion",
    h1: "Automatización empresarial con IA: chatbots y n8n",
    intro:
      "Tu negocio atendiendo, vendiendo y prospectando 24/7: chatbots de WhatsApp con IA, workflows n8n y agentes de voz. Setup + mensualidad todo incluido (tokens, telefonía e infraestructura).",
    description:
      "Automatización empresarial con IA: chatbots de WhatsApp e Instagram desde $199 setup + $49/mes, workflows n8n de prospección automática, agentes de voz y scraping. Todo incluido: tokens, telefonía e infraestructura.",
    keywords: [
      "chatbot whatsapp para negocios precio",
      "automatizacion whatsapp empresa",
      "n8n automatizacion negocios",
      "inteligencia artificial para ventas",
      "chatbot inteligencia artificial Venezuela",
    ],
    faqs: [
      {
        q: "¿Qué es un chatbot de WhatsApp y para qué sirve?",
        a: "Es un asistente con IA que responde a tus clientes en WhatsApp 24/7: resuelve dudas, toma pedidos, agenda citas y escala a un humano cuando hace falta. Los negocios pierden ventas por responder tarde; el chatbot elimina ese problema.",
      },
      {
        q: "¿Cuánto cuesta un chatbot de WhatsApp?",
        a: "En Caskiuz: $199 USD de setup (una vez) + $49 USD/mes, con hasta 500 conversaciones incluidas (extra $0.05 por conversación). La mensualidad incluye TODO: tokens de IA, telefonía Twilio e infraestructura — no pagas nada aparte.",
      },
      {
        q: "¿Qué es n8n y por qué es mejor que Zapier?",
        a: "n8n es una plataforma de automatización self-hosted: los flujos corren en tu propia infraestructura, sin cobro por tarea como Zapier. Con un VPS de $5-10/mes automatizas miles de tareas al mes a costo fijo.",
      },
      {
        q: "¿Puede la IA prospectar clientes por mí?",
        a: "Sí. Los motores de prospección buscan negocios reales que necesitan tus productos, generan mensajes personalizados y te los entregan listos para enviar por WhatsApp: tú solo das clic y cierras la venta.",
      },
    ],
  },
  "redes-sociales": {
    categoryKey: "redes-sociales",
    h1: "Redes sociales automatizadas con IA",
    intro:
      "Reels, posts e historias generados con IA y publicados en automático. Planes desde $200/mes: tu marca activa todos los días sin que toques una app.",
    description:
      "Gestión de redes sociales automatizada con IA: reels, posts e historias generados y publicados automáticamente. Planes Básico $200/mes, Normal $300/mes y Premium $400/mes con herramientas de diseño e IA incluidas.",
    keywords: [
      "manejo de redes sociales precio",
      "community manager automatizado",
      "redes sociales para negocios",
      "contenido con inteligencia artificial",
      "gestion instagram automatica",
    ],
    faqs: [
      {
        q: "¿Cómo funciona la automatización de redes sociales?",
        a: "La IA genera el contenido (reels, posts, historias) siguiendo la identidad de tu marca, tú lo apruebas desde un panel simple y el sistema lo publica automáticamente en Instagram, Facebook y TikTok según el calendario.",
      },
      {
        q: "¿Qué incluye el plan y cuánto cuesta?",
        a: "Básico $200/mes (contenido y publicación automática), Normal $300/mes (+ historias y más volumen) y Premium $400/mes (+ herramientas premium de video IA). Herramientas de diseño e IA incluidas en todos.",
      },
      {
        q: "¿Puedo aprobar el contenido antes de publicarse?",
        a: "Sí: nada se publica sin tu OK. El flujo es generar → revisar → aprobar → publicar en automático.",
      },
      {
        q: "¿Funciona para mi tipo de negocio?",
        a: "Funciona para restaurantes, tiendas, clínicas, agencias, marcas personales y más. La IA aprende el tono de tu marca con una breve encuesta inicial.",
      },
    ],
  },
};

interface ServiciosLandingProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(LANDINGS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ServiciosLandingProps): Promise<Metadata> {
  const { slug } = await params;
  const def = LANDINGS[slug];
  if (!def) return { title: "Servicio no encontrado | Caskiuz" };
  return {
    title: `${def.h1} | Caskiuz`,
    description: def.description,
    keywords: def.keywords,
    alternates: { canonical: `${BASE_URL}/servicios/${slug}` },
    openGraph: {
      title: `${def.h1} | Caskiuz`,
      description: def.description,
      url: `${BASE_URL}/servicios/${slug}`,
      siteName: "Caskiuz Portfolio",
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(def.h1)}&subtitle=${encodeURIComponent("Precios desde $149 USD · Entrega en días")}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function ServiciosLanding({
  params,
}: ServiciosLandingProps) {
  const { slug } = await params;
  const def = LANDINGS[slug];
  if (!def) notFound();

  const category = serviceCategories.find((c) => c.key === def.categoryKey);
  const services = defaultServices.filter((s) => s.category === def.categoryKey);
  const plans = category?.planGroup
    ? defaultMonthlyPlans.filter((p) => p.group === category.planGroup)
    : [];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: def.h1,
    description: def.description,
    provider: {
      "@type": "Person",
      name: "Caskiuz",
      url: BASE_URL,
    },
    areaServed: ["VE", "CO", "PE", "MX", "EC", "US"],
    ...(plans.length
      ? {
          offers: plans.map((p) => ({
            "@type": "Offer",
            name: p.name,
            price: p.price,
            priceCurrency: "USD",
            description: p.tagline,
          })),
        }
      : {}),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: def.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen pt-28 pb-24 aff-glow">
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-aff-cyan transition-colors">
              Inicio
            </Link>{" "}
            / <span className="text-aff-cyan">Servicios</span>
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            {def.h1}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {def.intro}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-aff rounded-xl"
            >
              Cotizar en 3 pasos →
            </Link>
            <a
              href="https://wa.me/584262931869?text=Hola%20Caskiuz!%20%F0%9F%91%8B%20Vengo%20de%20tu%20web%20y%20quiero%20cotizar%20un%20proyecto."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp directo
            </a>
          </div>
        </div>

        {/* Planes */}
        {plans.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-5">
              Planes <span className="metal-text">mensuales</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {plans.map((p) => (
                <div key={p.id} className="metal-card rounded-2xl p-5 flex flex-col">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">{p.tagline}</p>
                  <p className="text-3xl font-bold metal-text mb-4">
                    ${p.price}
                    <span className="text-xs text-muted-foreground font-normal"> /mes</span>
                  </p>
                  <ul className="space-y-1.5 mb-4 flex-1">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-aff-cyan shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Servicios */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-5">
            Servicios <span className="metal-text">personalizados</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {services.map((s) => (
              <div key={s.id} className="metal-card rounded-2xl p-5">
                <h3 className="text-base sm:text-lg font-bold leading-snug">{s.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mt-2 mb-3">
                  {s.description}
                </p>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                  <span className="text-lg sm:text-xl font-bold metal-text">{s.price}</span>
                  {s.deliveryTime && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" /> Entrega: {s.deliveryTime}
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {s.features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-aff-cyan shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-5">
            Preguntas <span className="metal-text">frecuentes</span>
          </h2>
          <div className="space-y-3">
            {def.faqs.map((f) => (
              <details key={f.q} className="glass-card group rounded-2xl overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 font-semibold text-sm sm:text-base">
                  {f.q}
                </summary>
                <p className="px-4 sm:px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center relative overflow-hidden rounded-2xl bg-gradient-to-r from-aff-blue/10 via-aff-blue/5 to-aff-cyan/10 border border-aff-blue/20 p-8">
          <h2 className="text-2xl font-bold mb-2">¿Listo para empezar?</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            3 pasos rápidos y recibes una propuesta preliminar con IA en minutos. Sin compromiso.
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold btn-aff rounded-xl"
          >
            Empezar ahora →
          </Link>
        </div>
      </div>
    </div>
  );
}
