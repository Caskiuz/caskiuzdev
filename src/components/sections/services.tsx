"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
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
  Lock,
  ChevronDown,
  Target,
  Workflow,
  MessageSquare,
  Phone,
  Eye,
  TrendingUp,
  Share2,
  Video,
  Package,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import {
  MessageCircle,
  Clock,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import {
  type ServiceItem,
  type MonthlyPlan,
  defaultServices,
  serviceCategories as categories,
  monthlyPlanGroups,
  defaultMonthlyPlans,
  mergeServices,
} from "@/lib/services-defaults";
import {
  type PublicPaymentMethodInfo,
} from "@/lib/payments";
import {
  CLIENT_PAYMENT_ICONS,
  CLIENT_ICON_CLASS,
} from "@/components/ui/payment-icons";
import { useReferralCode, appendReferralCode } from "@/lib/referral-cookie";

const iconMap: Record<string, LucideIcon> = {
  Globe, Smartphone, Server, Zap, Rocket, ShoppingCart, BarChart3, Bot, Headset,
  Search, MapPin, Target, Workflow, MessageSquare, Phone, Eye, TrendingUp,
  Share2, Video, Package, Cpu,
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
  /** Métodos de pago activos (solo id y nombre: sin datos de cuentas). */
  paymentMethods?: PublicPaymentMethodInfo[];
}

export function Services({ config = {}, paymentMethods = [] }: ServicesProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;
  const activeMethods = paymentMethods;
  const referralCode = useReferralCode();
  // Link de WhatsApp con el código de referido del visitante (si llegó por un afiliado)
  const wa = (message: string) =>
    `https://wa.me/${c("contact_whatsapp", "584262931869").replace(/\D/g, "")}?text=${encodeURIComponent(appendReferralCode(message, referralCode))}`;

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

  // Acordeón: una categoría abierta a la vez
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const openCat = categories.find((cat) => cat.key === openCategory) ?? null;
  const openServices = openCat
    ? services.filter((s) => s.category === openCat.key)
    : [];

  useEffect(() => {
    if (!openCategory || !detailRef.current) return;
    // Auto-scroll al panel expandido: el cambio debe verse al instante al hacer
    // clic. Se usa scrollTo con posición absoluta porque scrollIntoView resulta
    // poco fiable dentro del contenedor animado con overflow-hidden.
    const t = setTimeout(() => {
      const el = detailRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 150);
    return () => clearTimeout(t);
  }, [openCategory]);

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
          <span className="text-sm font-semibold text-aff-cyan uppercase tracking-wider">
            {c("services_label", "Servicios")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Lo que <span className="metal-text">{c("services_title", "puedo hacer")} por ti</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {c(
              "services_subtitle",
              "Automatizo empresas para que vendan más. Toca una categoría y descubre el alcance de cada servicio."
            )}
          </p>
        </motion.div>

        {/* Category summary cards — sin precios, solo alcance */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {categories.map((cat) => {
            const count = services.filter((s) => s.category === cat.key).length;
            const isOpen = openCategory === cat.key;
            if (count === 0) return null;

            return (
              <motion.button
                key={cat.key}
                variants={itemVariants}
                onClick={() => setOpenCategory(isOpen ? null : cat.key)}
                aria-expanded={isOpen}
                className={`group relative h-full flex flex-col text-left rounded-2xl p-5 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-aff-cyan/60 ${
                  isOpen
                    ? "metal-border bg-surface shadow-lg shadow-aff-blue/10"
                    : "metal-card hover:-translate-y-1 hover:shadow-lg hover:shadow-aff-blue/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-3xl leading-none">{cat.emoji}</span>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground">
                    {count} servicio{count !== 1 ? "s" : ""}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold mb-1.5">{cat.label}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4">
                  {cat.tagline}
                </p>

                <div className="mt-auto flex items-center gap-2 text-xs sm:text-sm font-semibold text-aff-cyan">
                  {isOpen ? "Cerrar detalle" : "Ver detalle"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Hint */}
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Toca una categoría para expandir sus servicios con inversión y tiempo de entrega.
        </p>

        {/* Acordeón: detalle de la categoría abierta */}
        <AnimatePresence initial={false}>
          {openCat && openServices.length > 0 && (
            <motion.div
              key={openCat.key}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div ref={detailRef} className="pt-8">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="text-3xl">{openCat.emoji}</span>
                    <span>{openCat.label}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  </h3>
                  <p className="mt-3 text-muted-foreground text-sm max-w-2xl">
                    {openCat.tagline}
                  </p>
                </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {openServices.map((service, i) => (
                    <ServiceCard
                      key={service.id || `${openCat.key}-${i}`}
                      service={service}
                      wa={wa}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Planes mensuales automatizados ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-24"
        >
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-aff-cyan uppercase tracking-wider">
              Planes Mensuales
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Automatización <span className="metal-text">por suscripción</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Sistemas que trabajan solos todos los meses por tu empresa.
              Facturación mensual — cancela cuando quieras.
            </p>
          </div>

          {monthlyPlanGroups.map((group) => {
            const plans = defaultMonthlyPlans.filter((p) => p.group === group.key);
            if (plans.length === 0) return null;

            return (
              <div key={group.key} className="mb-14 last:mb-0">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="text-3xl">{group.emoji}</span>
                    <span>{group.title}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  </h3>
                  <p className="mt-3 text-muted-foreground text-sm max-w-2xl">
                    {group.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} groupName={group.title} wa={wa} />
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Payment policy banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16 mt-16"
        >
          <div className="relative overflow-hidden metal-card rounded-2xl p-6 sm:p-8 text-center">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-aff-cyan/5 rounded-full blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-2 text-base sm:text-lg font-semibold">
              <span>💳</span>
              <span>Todos los proyectos inician con el</span>
              <span className="metal-text font-bold">50% de anticipo</span>
              <span>y el</span>
              <span className="metal-text font-bold">50% restante al finalizar</span>
            </div>
            <p className="relative text-xs text-muted-foreground mt-2">
              Los planes mensuales aplican facturación mensual recurrente.
            </p>

            {activeMethods.length > 0 && (
              <>
                <p className="relative mt-6 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                  Pagos seguros vía
                </p>
                <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {activeMethods.map((method) => {
                    const Icon = CLIENT_PAYMENT_ICONS[method.id];
                    if (!Icon) return null;
                    return (
                      <div
                        key={method.id}
                        className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface-hover/40 px-3 py-4"
                      >
                        <span className="flex h-11 items-center justify-center">
                          <Icon className={CLIENT_ICON_CLASS[method.id] ?? CLIENT_ICON_CLASS.default} />
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground text-center leading-tight">
                          {method.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <p className="relative mt-5 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-aff-cyan" />
              Te comparto los datos de pago al confirmar tu proyecto.
            </p>
          </div>
        </motion.div>

        {/* Lead magnet CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-aff-blue/10 via-aff-blue/5 to-aff-cyan/10 border border-aff-blue/20 p-8 sm:p-10 text-center">
            <div className="absolute top-0 right-0 w-40 h-40 bg-aff-cyan/5 rounded-full blur-3xl" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              🎁 ¿No sabes qué necesita tu proyecto?
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Solicita una <span className="text-aff-cyan font-semibold">consultoría gratuita de 15 minutos</span> por WhatsApp.
              Analizamos tu idea juntos y te doy un plan de acción claro, sin compromiso.
            </p>
            <a
              href={wa("Hola Caskiuz! Quiero mi consultoría gratuita de 15 min 🎁")}
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
              href={wa("Hola Caskiuz! Tengo un proyecto personalizado y quiero conversar contigo.")}
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

/* ─────────────────────────── Sub-componentes ─────────────────────────── */

type WaFn = (message: string) => string;

/** Card de servicio individual (precio visible solo dentro del detalle expandido). */
function ServiceCard({
  service,
  wa,
}: {
  service: ServiceItem;
  wa: WaFn;
}) {
  const IconComp = iconMap[service.icon || ""] || Globe;

  return (
    <div className="group relative h-full">
      <div
        className={`relative h-full rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
          service.popular ? "metal-border bg-surface" : "metal-card"
        }`}
      >
        {service.popular && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold text-white bg-gradient-to-r from-aff-blue to-aff-cyan rounded-full shadow-lg shadow-aff-blue/25">
            Más Popular
          </span>
        )}

        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
            service.popular
              ? "bg-aff-cyan/10 text-aff-cyan"
              : "bg-muted text-muted-foreground group-hover:text-aff-cyan group-hover:bg-aff-cyan/10"
          } transition-colors`}
        >
          <IconComp className="w-6 h-6" />
        </div>

        <h4 className="text-xl font-bold mb-2">{service.title}</h4>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {service.description}
        </p>

        {/* Price — formatted as investment */}
        <div className="mb-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
            💰 Inversión
          </span>
          <div className="text-2xl font-bold metal-text">{service.price}</div>
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
              <CheckCircle2 className="w-4 h-4 text-aff-cyan flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTAs — WhatsApp primary, form secondary */}
        <div className="space-y-2">
          <a
            href={wa(`Hola Caskiuz! 👋 Me interesa: ${service.title} (${service.price}). ¿Podemos conversar?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 text-sm font-medium text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full transition-all duration-200 shadow-md shadow-[#25D366]/15"
          >
            <MessageCircle className="w-4 h-4 inline mr-1.5" />
            Cotizar por WhatsApp
          </a>
          <Link
            href="#contact"
            className="block w-full text-center py-2 text-xs font-medium text-muted-foreground border border-border rounded-full transition-all duration-200 hover:border-aff-cyan/30 hover:text-aff-cyan"
          >
            <ExternalLink className="w-3 h-3 inline mr-1" />
            Formulario de contacto
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Card de plan mensual (Básico / Normal / Premium). */
function PlanCard({
  plan,
  groupName,
  wa,
}: {
  plan: MonthlyPlan;
  groupName: string;
  wa: WaFn;
}) {
  return (
    <div className="relative h-full">
      <div
        className={`relative h-full rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
          plan.popular ? "metal-border bg-surface" : "metal-card"
        }`}
      >
        {plan.popular && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold text-white bg-gradient-to-r from-aff-blue to-aff-cyan rounded-full shadow-lg shadow-aff-blue/25">
            Más Popular
          </span>
        )}

        <div className="mb-1 flex items-center justify-between gap-2">
          <h4 className="text-lg font-bold">{plan.name}</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-5">{plan.tagline}</p>

        {/* Price */}
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
            Plan mensual
          </span>
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-bold metal-text">${plan.price}</span>
            <span className="text-sm text-muted-foreground mb-1.5">USD/mes</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-7">
          {plan.features.map((feature, j) => (
            <li key={j} className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-aff-cyan flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={wa(`Hola Caskiuz! 👋 Me interesa el plan ${plan.name} de ${groupName} ($${plan.price}/mes). ¿Podemos conversar?`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full text-center py-2.5 text-sm font-medium text-white rounded-full transition-all duration-200 ${
            plan.popular
              ? "bg-[#25D366] hover:bg-[#22c55e] shadow-lg shadow-[#25D366]/25"
              : "bg-[#25D366] hover:bg-[#22c55e] shadow-md shadow-[#25D366]/15"
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-1.5" />
          Contratar plan {plan.name}
        </a>
      </div>
    </div>
  );
}
