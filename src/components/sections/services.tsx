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
import { MessageCircle, Clock, ExternalLink } from "lucide-react";
import {
  type ServiceItem,
  defaultServices,
  serviceCategories as categories,
  mergeServices,
} from "@/lib/services-defaults";

const iconMap: Record<string, React.ComponentType<any>> = {
  Globe, Smartphone, Server, Zap, Rocket, ShoppingCart, BarChart3, Bot, Headset,
  Search, MapPin,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ServicesProps {
  config?: Record<string, string>;
}

export function Services({ config = {} }: ServicesProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;

  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Merge: DB services take priority, new defaults appended automatically
  let services: ServiceItem[] = defaultServices;
  try {
    const raw = config["services_data"];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        services = mergeServices(parsed);
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

                        {/* Price — formatted as investment */}
                        <div className="mb-3">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                            💰 Inversión
                          </span>
                          <div className="text-2xl font-bold gradient-text">
                            {service.price}
                          </div>
                          {service.deliveryTime && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Entrega: {service.deliveryTime}</span>
                            </div>
                          )}
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

                        {/* CTAs — WhatsApp primary, form secondary */}
                        <div className="space-y-2">
                          <a
                            href={`https://wa.me/584262931869?text=${encodeURIComponent(`Hola Caskiuz! 👋 Me interesa: ${service.title} (${service.price}). ¿Podemos conversar?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block w-full text-center py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                              service.popular
                                ? "text-white bg-[#25D366] hover:bg-[#22c55e] shadow-lg shadow-[#25D366]/25"
                                : "text-white bg-[#25D366] hover:bg-[#22c55e] shadow-md shadow-[#25D366]/15"
                            }`}
                          >
                            <MessageCircle className="w-4 h-4 inline mr-1.5" />
                            Cotizar por WhatsApp
                          </a>
                          <Link
                            href="#contact"
                            className={`block w-full text-center py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                              service.popular
                                ? "text-primary border border-primary/30 hover:bg-primary/5"
                                : "text-muted-foreground border border-border hover:border-primary/30 hover:text-primary"
                            }`}
                          >
                            <ExternalLink className="w-3 h-3 inline mr-1" />
                            Formulario de contacto
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          );
        })}

        {/* Lead magnet CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border border-primary/20 p-8 sm:p-10 text-center">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              🎁 ¿No sabes qué necesita tu proyecto?
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Solicita una <span className="text-primary font-semibold">consultoría gratuita de 15 minutos</span> por WhatsApp. 
              Analizamos tu idea juntos y te doy un plan de acción claro, sin compromiso.
            </p>
            <a
              href={`https://wa.me/584262931869?text=${encodeURIComponent("Hola Caskiuz! Quiero mi consultoría gratuita de 15 min 🎁")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full transition-all duration-200 shadow-xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              Quiero mi consultoría gratis
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              ⚡ Cupos limitados esta semana — Sin compromiso, sin letra pequeña
            </p>
          </div>
        </motion.div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm">
            ¿Necesitas algo más específico?{" "}
            <a
              href={`https://wa.me/584262931869?text=${encodeURIComponent("Hola Caskiuz! Tengo un proyecto personalizado y quiero conversar contigo.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] font-medium hover:underline"
            >
              Conversemos por WhatsApp
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}