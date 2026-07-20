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
} from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: Globe,
    title: "Web Apps",
    description:
      "Aplicaciones web full-stack con React, Next.js y TypeScript. SSR, SSG, ISR — la estrategia correcta para cada caso.",
    price: "Desde $800 USD",
    features: [
      "Next.js / React SPA",
      "Server Side Rendering",
      "SEO optimizado",
      "Responsive design",
    ],
    popular: true,
    category: "desarrollo",
  },
  {
    icon: Smartphone,
    title: "Mobile Apps",
    description:
      "Apps nativas y multiplataforma con React Native y Expo. Una sola base de código para iOS y Android.",
    price: "Desde $1,200 USD",
    features: [
      "iOS + Android",
      "Expo managed workflow",
      "Push notifications",
      "Offline-first",
    ],
    popular: false,
    category: "desarrollo",
  },
  {
    icon: Server,
    title: "APIs & Backend",
    description:
      "APIs RESTful y GraphQL con Node.js, Express, MySQL y arquitecturas serverless escalables.",
    price: "Desde $500 USD",
    features: [
      "REST / GraphQL APIs",
      "MySQL / PostgreSQL",
      "Autenticación JWT/OAuth",
      "Microservicios",
    ],
    popular: false,
    category: "desarrollo",
  },
  {
    icon: Zap,
    title: "Landing Pages",
    description:
      "Landing pages de alto rendimiento optimizadas para conversión. Carga ultrarrápida, diseño premium y formularios integrados.",
    price: "Desde $300 USD",
    features: [
      "Next.js + TailwindCSS",
      "Animaciones Framer Motion",
      "SEO 100% optimizado",
      "Formulario con WhatsApp/Email",
    ],
    popular: false,
    category: "desarrollo",
  },
  {
    icon: Rocket,
    title: "SaaS MVP",
    description:
      "Producto mínimo viable para startups. Autenticación, pagos, dashboard y deploy en tiempo récord.",
    price: "Desde $1,800 USD",
    features: [
      "Auth + Roles de usuario",
      "Stripe / MercadoPago",
      "Dashboard administrativo",
      "Deploy en Vercel/AWS",
    ],
    popular: true,
    category: "producto",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce",
    description:
      "Tiendas online completas con carrito, pagos integrados y panel de administración de productos.",
    price: "Desde $1,500 USD",
    features: [
      "Stripe / MercadoPago",
      "Gestión de inventario",
      "Carrito + Checkout",
      "SEO para productos",
    ],
    popular: false,
    category: "producto",
  },
  {
    icon: BarChart3,
    title: "Dashboards & CRM",
    description:
      "Paneles administrativos y CRMs a medida con gráficos, reportes y gestión de datos en tiempo real.",
    price: "Desde $900 USD",
    features: [
      "Gráficos interactivos",
      "Exportación CSV/PDF",
      "Roles y permisos",
      "Filtros avanzados",
    ],
    popular: false,
    category: "producto",
  },
  {
    icon: Bot,
    title: "Integración IA",
    description:
      "Agrega inteligencia artificial a tu producto: chatbots, generadores de contenido, análisis predictivo con OpenAI/Claude.",
    price: "Desde $500 USD",
    features: [
      "ChatGPT / Claude API",
      "Chatbots inteligentes",
      "Generación de contenido",
      "Análisis de sentimiento",
    ],
    popular: false,
    category: "producto",
  },
  {
    icon: Headset,
    title: "Mantenimiento & Soporte",
    description:
      "Paz mental para tu negocio. Hosting, backups, actualizaciones, monitoreo 24/7 y soporte técnico continuo.",
    price: "Desde $150 USD/mes",
    features: [
      "Hosting + Dominio",
      "Backups automáticos",
      "Actualizaciones de seguridad",
      "Soporte prioritario 24/7",
    ],
    popular: true,
    category: "consultoria",
  },
];

const categories = [
  { key: "desarrollo", label: "🏗️ Desarrollo" },
  { key: "producto", label: "🚀 Producto" },
  { key: "consultoria", label: "🔧 Consultoría" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Services() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
            Servicios
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Lo que <span className="gradient-text">puedo hacer</span> por ti
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Soluciones a medida para cada etapa de tu producto digital, desde el
            MVP hasta la escala empresarial. Más de 9 servicios pensados para hacer crecer tu negocio.
          </p>
        </motion.div>

        {/* Services by category */}
        {categories.map((cat) => {
          const catServices = services.filter((s) => s.category === cat.key);
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
                {catServices.map((service, i) => (
                  <motion.div
                    key={`${cat.key}-${i}`}
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
                        <service.icon className="w-6 h-6" />
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
                ))}
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