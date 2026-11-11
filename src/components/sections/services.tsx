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
  ArrowUp,
  type LucideIcon,
} from "lucide-react";
import {
  type ServiceItem,
  type MonthlyPlan,
  defaultServices,
  serviceCategories as categories,
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
  const gridRef = useRef<HTMLDivElement>(null);

  /** Cierra el detalle y lleva la vista al grid de categorías. */
  const scrollToCategories = () => {
    setOpenCategory(null);
    const el = gridRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const openCat = categories.find((cat) => cat.key === openCategory) ?? null;
  const openServices = openCat
    ? services.filter((s) => s.category === openCat.key)
    : [];
  // Planes mensuales de la categoría abierta — se muestran directamente en su detalle
  const openPlans: MonthlyPlan[] = openCat?.planGroup
    ? defaultMonthlyPlans.filter((p) => p.group === openCat.planGroup)
    : [];
  // Categorías con contenido real (servicios o planes) para el navegador del detalle
  const categoriesWithContent = categories.filter(
    (cat) =>
      services.some((s) => s.category === cat.key) ||
      (cat.planGroup && defaultMonthlyPlans.some((p) => p.group === cat.planGroup))
  );

  useEffect(() => {
    if (!openCategory || !detailRef.current) return;
    // Auto-scroll al panel expandido. Se espera (~0.55s) a que terminen las
    // animaciones de salida/entrada para medir la posición FINAL del panel:
    // si se mide antes, el panel saliente aún ocupa espacio y el scroll apunta
    // más abajo (aterriza en el banner de pagos en vez de en la categoría).
    const t = setTimeout(() => {
      const el = detailRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 550);
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
          ref={gridRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {categories.map((cat) => {
            const count = services.filter((s) => s.category === cat.key).length;
            const planCount = cat.planGroup
              ? defaultMonthlyPlans.filter((p) => p.group === cat.planGroup).length
              : 0;
            const isOpen = openCategory === cat.key;
            if (count === 0 && planCount === 0) return null;

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
                    {count > 0
                      ? `${count} servicio${count !== 1 ? "s" : ""}`
                      : `${planCount} plan${planCount !== 1 ? "es" : ""}`}
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
          Toca una categoría para ver sus planes mensuales y servicios.
        </p>

        {/* Acordeón: detalle de la categoría abierta */}
        <AnimatePresence initial={false}>
          {openCat && (openServices.length > 0 || openPlans.length > 0) && (
            <motion.div
              key={openCat.key}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div ref={detailRef} className="pt-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="text-3xl">{openCat.emoji}</span>
                    <span>{openCat.label}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
                    {openCat.tagline}
                  </p>
                </div>

                {/* Planes mensuales de la categoría — al abrir el detalle se ven de una vez */}
                {openPlans.length > 0 && (
                  <div className="mb-12">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
                      <h4 className="text-lg font-bold">
                        Planes <span className="metal-text">mensuales</span>
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        Facturación mensual — cancela cuando quieras
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {openPlans.map((plan) => (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          groupName={openCat.label}
                          wa={wa}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Servicios personalizados de la categoría */}
                {openServices.length > 0 && (
                  <>
                    {openPlans.length > 0 && (
                      <h4 className="text-lg font-bold mb-5">
                        Servicios <span className="metal-text">personalizados</span>
                      </h4>
                    )}
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                      {openServices.map((service, i) => (
                        <ServiceCard
                          key={service.id || `${openCat.key}-${i}`}
                          service={service}
                          wa={wa}
                        />
                      ))}
                    </motion.div>
                  </>
                )}

                {/* Cambiar de categoría sin volver a subir */}
                <div className="mt-12">
                  <div className="relative overflow-hidden metal-card rounded-2xl p-6 sm:p-8 text-center">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-aff-cyan/5 rounded-full blur-3xl" />
                    <p className="relative text-xs font-semibold uppercase tracking-wider text-aff-cyan mb-1.5">
                      Sigue explorando
                    </p>
                    <h4 className="relative text-xl font-bold mb-5">
                      Cambia de <span className="metal-text">categoría</span>
                    </h4>
                    <div className="relative flex flex-wrap justify-center gap-2.5">
                      {categoriesWithContent.map((cat) =>
                        cat.key === openCat.key ? (
                          <span
                            key={cat.key}
                            aria-current="true"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-aff-blue to-aff-cyan text-white shadow-lg shadow-aff-blue/25 cursor-default"
                          >
                            <span>{cat.emoji}</span>
                            {cat.shortLabel}
                          </span>
                        ) : (
                          <button
                            key={cat.key}
                            onClick={() => setOpenCategory(cat.key)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold metal-card transition-all duration-200 hover:border-aff-cyan/40 hover:text-aff-cyan hover:-translate-y-0.5 cursor-pointer"
                          >
                            <span>{cat.emoji}</span>
                            {cat.shortLabel}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={scrollToCategories}
                      className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-aff-cyan transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      Volver a todas las categorías
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

/** Card de servicio individual — compacta para verse completa en pantalla. */
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
        className={`relative h-full flex flex-col rounded-2xl p-5 transition-all duration-300 ${
          service.popular ? "metal-border bg-surface" : "metal-card"
        }`}
      >
        {service.popular && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 text-[11px] font-semibold text-white bg-gradient-to-r from-aff-blue to-aff-cyan rounded-full shadow-lg shadow-aff-blue/25">
            Más Popular
          </span>
        )}

        {/* Icono + título en una fila */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              service.popular
                ? "bg-aff-cyan/10 text-aff-cyan"
                : "bg-muted text-muted-foreground group-hover:text-aff-cyan group-hover:bg-aff-cyan/10"
            } transition-colors`}
          >
            <IconComp className="w-5 h-5" />
          </div>
          <h4 className="text-base sm:text-lg font-bold leading-snug">
            {service.title}
          </h4>
        </div>

        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-3">
          {service.description}
        </p>

        {/* Precio + entrega en una línea */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
          <span className="text-lg sm:text-xl font-bold metal-text">
            {service.price}
          </span>
          {service.deliveryTime && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              Entrega: {service.deliveryTime}
            </span>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-1.5 mb-4">
          {service.features.map((feature, j) => (
            <li key={j} className="flex items-center gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-aff-cyan flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTAs — WhatsApp primary, form secondary */}
        <div className="mt-auto space-y-1.5">
          <a
            href={wa(`Hola Caskiuz! 👋 Me interesa: ${service.title} (${service.price}). ¿Podemos conversar?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2 text-xs sm:text-sm font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full transition-all duration-200 shadow-md shadow-[#25D366]/15"
          >
            <MessageCircle className="w-4 h-4 inline mr-1.5" />
            Cotizar por WhatsApp
          </a>
          <Link
            href="#contact"
            className="block w-full text-center py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-aff-cyan"
          >
            <ExternalLink className="w-3 h-3 inline mr-1" />
            Formulario de contacto
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Card de plan mensual (Básico / Normal / Premium) — compacta. */
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
        className={`relative h-full flex flex-col rounded-2xl p-5 transition-all duration-300 ${
          plan.popular ? "metal-border bg-surface" : "metal-card"
        }`}
      >
        {plan.popular && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 text-[11px] font-semibold text-white bg-gradient-to-r from-aff-blue to-aff-cyan rounded-full shadow-lg shadow-aff-blue/25">
            Más Popular
          </span>
        )}

        <h4 className="text-base sm:text-lg font-bold mb-1">{plan.name}</h4>
        <p className="text-[11px] sm:text-xs text-muted-foreground mb-4">
          {plan.tagline}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap mb-4">
          <span className="text-3xl font-bold metal-text">${plan.price}</span>
          <span className="text-xs text-muted-foreground">USD/mes</span>
        </div>

        {/* Features */}
        <ul className="space-y-1.5 mb-4">
          {plan.features.map((feature, j) => (
            <li key={j} className="flex items-center gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-aff-cyan flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={wa(`Hola Caskiuz! 👋 Me interesa el plan ${plan.name} de ${groupName} ($${plan.price}/mes). ¿Podemos conversar?`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto block w-full text-center py-2 text-xs sm:text-sm font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full transition-all duration-200 shadow-md shadow-[#25D366]/15"
        >
          <MessageCircle className="w-4 h-4 inline mr-1.5" />
          Contratar plan {plan.name}
        </a>
      </div>
    </div>
  );
}
