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