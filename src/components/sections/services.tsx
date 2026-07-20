"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Globe,
  Smartphone,
  Server,
  Zap,
  ShoppingCart,
  BarChart3,
  Bot,
  Headset,
  Rocket,
  CheckCircle2,
  Search,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, React.ComponentType<any>> = {
  Globe, Smartphone, Server, Zap, Rocket, ShoppingCart, BarChart3, Bot, Headset,
  Search, MapPin,
};

const defaultServices = [
  {
    id: "s1", icon: "Globe", title: "Web Apps",
    description: "Aplicaciones web full-stack con React, Next.js y TypeScript. Código 100% custom, sin plantillas. Precio ajustable según alcance.",
    price: "Desde $350 USD", category: "desarrollo",
    features: ["Next.js / React SPA", "TypeScript + SSR/ISG", "SEO optimizado", "Pago 50% inicio / 50% entrega"],
    popular: true,
  },
  {
    id: "s2", icon: "Smartphone", title: "Mobile Apps",
    description: "Apps nativas y multiplataforma con React Native y Expo. Versión MVP desde precio base; funcionalidades extra ajustan el valor.",
    price: "Desde $800 USD", category: "desarrollo",
    features: ["iOS + Android (MVP)", "Expo managed workflow", "Push notifications", "Financiamiento por hitos"],
    popular: false,
  },
  {
    id: "s3", icon: "Server", title: "APIs & Backend",
    description: "APIs RESTful y GraphQL con Node.js, Express, MySQL. Escala con la complejidad del proyecto.",
    price: "Desde $300 USD", category: "desarrollo",
    features: ["REST / GraphQL APIs", "MySQL / PostgreSQL", "Autenticación JWT/OAuth", "Arquitectura escalable"],
    popular: false,
  },
  {
    id: "s4", icon: "Zap", title: "Landing Pages",
    description: "Landing pages de alto rendimiento con código custom. Sin plantillas WordPress — velocidad y SEO real. El gancho perfecto para tu negocio.",
    price: "Desde $150 USD", category: "desarrollo",
    features: ["Next.js + TailwindCSS", "Animaciones Framer Motion", "SEO 100% optimizado", "Formulario con WhatsApp/Email"],
    popular: false,
  },
  {
    id: "s5", icon: "Rocket", title: "SaaS MVP",
    description: "Producto mínimo viable para startups. Valida tu idea en semanas. El precio final depende de funcionalidades.",
    price: "Desde $1,000 USD", category: "producto",
    features: ["Auth + Roles de usuario", "Stripe / MercadoPago", "Dashboard administrativo", "Financiamiento 50/50"],
    popular: true,
  },
  {
    id: "s6", icon: "ShoppingCart", title: "E-commerce",
    description: "Tiendas online con carrito, pagos y panel de administración. Precio base para catálogo simple; crece con tu inventario.",
    price: "Desde $1,000 USD", category: "producto",
    features: ["Stripe / MercadoPago", "Gestión de inventario", "Carrito + Checkout", "Pago en 3 hitos"],
    popular: false,
  },
  {
    id: "s7", icon: "BarChart3", title: "Dashboards & CRM",
    description: "Paneles administrativos y CRMs a medida. Precio gancho para dashboards básicos; se ajusta con funcionalidades avanzadas.",
    price: "Desde $350 USD", category: "producto",
    features: ["Gráficos interactivos", "Exportación CSV/PDF", "Roles y permisos", "Pago 50% inicio / 50% entrega"],
    popular: false,
  },
  {
    id: "s8", icon: "Bot", title: "Integración IA",
    description: "Conecta tu producto a OpenAI, Claude o la IA que necesites. Chatbots, generadores de contenido, análisis. Precio de entrada inmejorable.",
    price: "Desde $150 USD", category: "producto",
    features: ["ChatGPT / Claude API", "Chatbots inteligentes", "Generación de contenido", "Análisis de sentimiento"],
    popular: false,
  },
  {
    id: "s9", icon: "Headset", title: "Mantenimiento & Soporte",
    description: "Hosting, backups, actualizaciones y una bolsa de horas mensual para cambios. Paga solo por lo que necesitas.",
    price: "Desde $80 USD/mes", category: "consultoria",
    features: ["Hosting + Dominio incluido", "3h de cambios/soporte al mes", "Backups automáticos", "Actualizaciones de seguridad"],
    popular: true,
  },
  {
    id: "seo1", icon: "Search", title: "Auditoría SEO Completa",
    description: "Análisis técnico, on-page y de competencia con reporte detallado. Descubrí exactamente qué impide que tu sitio aparezca en Google.",
    price: "Desde $199 USD", category: "seo",
    features: ["Reporte técnico + on-page + competencia", "Análisis de Core Web Vitals", "Plan de acción priorizado (PDF)", "Consultoría 1h para revisar hallazgos"],
    popular: true,
  },
  {
    id: "seo2", icon: "Zap", title: "SEO On-Page + Velocidad",
    description: "Optimización de meta tags, headings, schema markup y rendimiento. Tu sitio pasará de lento a volar en搜索结果.",
    price: "Desde $299 USD", category: "seo",
    features: ["Meta tags + headings optimizados", "Schema markup (JSON-LD)", "Lighthouse ≥ 90 garantizado", "Core Web Vitals en verde"],
    popular: false,
  },
  {
    id: "seo3", icon: "MapPin", title: "SEO Local (Google My Business)",
    description: "Perfil de negocio verificado, optimizado y conectado a tu web. Aparecé en el mapa cuando tus clientes te busquen.",
    price: "Desde $199 USD", category: "seo",
    features: ["Perfil GMB verificado y optimizado", "Fotos, horarios, servicios configurados", "Vinculación con tu sitio web", "Estrategia de reseñas locales"],
    popular: false,
  },
  {
    id: "seo4", icon: "BarChart3", title: "Keyword Research + Contenido",
    description: "Investigación de palabras clave rentables + artículos listos para publicar. Atrae tráfico que convierte.",
    price: "Desde $249 USD", category: "seo",
    features: ["30+ keywords con volumen y dificultad", "Análisis de intención de búsqueda", "2 artículos optimizados listos para publicar", "Estrategia de contenidos a 3 meses"],
    popular: false,
  },
];

const categories = [
  { key: "desarrollo", label: "🏗️ Desarrollo" },
  { key: "producto", label: "🚀 Producto" },
  { key: "consultoria", label: "🔧 Consultoría" },
  { key: "seo", label: "🔍 SEO Web" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ServiceItem {
  id: string;
  icon?: string;
  title: string;
  description: string;
  price: string;
  category: string;
  features: string[];
  popular: boolean;
}

interface ServicesProps {
  config?: Record<string, string>;
}

export function Services({ config = {} }: ServicesProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;

  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Merge: DB services take priority, new defaults are appended
  let services: ServiceItem[] = defaultServices;
  try {
    const raw = config["services_data"];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const dbIds = new Set(parsed.map((s: ServiceItem) => s.id));
        // Defaults not in DB get appended (new services added in code)
        const newDefaults = defaultServices.filter((s) => !dbIds.has(s.id));
        services = [...parsed, ...newDefaults];
      }
    }
  } catch {
    // use defaults
  }

  return (
    <section ref={ref} id="services" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            {c("services_label", "Servicios")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Lo que <span className="gradient-text">{c("services_title", "puedo hacer")} por ti</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {c("services_subtitle", "Soluciones a medida para cada etapa de tu producto digital, desde el MVP hasta la escala empresarial.")}
          </p>
        </motion.div>

        {/* Services by category */}
        {categories.map((cat) => {
          const catServices = services.filter((s) => s.category === cat.key);
          if (catServices.length === 0) return null;

          return (
            <div key={cat.key} className="mb-16 last:mb-0">
              {/* Category title */}
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold mb-8 flex items-center gap-3"
              >
                <span>{cat.label}</span>
                <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              </motion.h3>

              {/* Services grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {catServices.map((service, i) => {
                  const IconComp = iconMap[service.icon || ""] || Globe;
                  return (
                    <motion.div
                      key={service.id || `${cat.key}-${i}`}
                      variants={itemVariants}
                      className="group relative"
                    >
                      <div
                        className={`relative h-full rounded-2xl border p-6 sm:p-8 transition-all duration-300 ${
                          service.popular
                            ? "border-primary/30 bg-surface gradient-border"
                            : "border-border bg-surface hover:bg-surface-hover"
                        }`}
                      >
                        {service.popular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold text-white bg-primary rounded-full shadow-lg shadow-primary/25">
                            Más Popular
                          </span>
                        )}

                        {/* Icon */}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                            service.popular
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                          } transition-colors`}
                        >
                          <IconComp className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                          {service.description}
                        </p>

                        {/* Price */}
                        <div className="text-2xl font-bold gradient-text mb-4">
                          {service.price}
                        </div>

                        {/* Features */}
                        <ul className="space-y-2.5 mb-6">
                          {service.features.map((feature, j) => (
                            <li key={j} className="flex items-center gap-2.5 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <Link
                          href="#contact"
                          className={`block w-full text-center py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                            service.popular
                              ? "text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25"
                              : "text-foreground bg-muted hover:bg-muted/80 border border-border"
                          }`}
                        >
                          Solicitar servicio
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          );
        })}

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm">
            ¿Necesitas algo más específico?{" "}
            <Link
              href="#contact"
              className="text-primary font-medium hover:underline"
            >
              Conversemos sobre tu proyecto
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}