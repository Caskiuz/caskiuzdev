"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Mail,
  MapPin,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useReferralCode, appendReferralCode } from "@/lib/referral-cookie";

interface ContactProps {
  config?: Record<string, string>;
}

/** Pasos del wizard conversacional: igual de compacto que el form anterior. */
const SERVICE_OPTIONS = [
  { value: "automatizacion", label: "🤖 Automatización & IA" },
  { value: "redes-sociales", label: "📲 Redes Sociales" },
  { value: "vision-ia", label: "📹 Visión IA & Cámaras" },
  { value: "desarrollo", label: "🏗️ Web & Apps" },
  { value: "producto", label: "🚀 Producto & E-commerce" },
  { value: "seo", label: "🔍 SEO" },
  { value: "soporte", label: "🔧 Soporte & Mantenimiento" },
  { value: "otro", label: "✨ Otro / No estoy seguro" },
];

const BUDGET_OPTIONS = [
  "Menos de $200",
  "$200 – $500",
  "$500 – $1,000",
  "$1,000 – $2,000",
  "Más de $2,000",
  "Aún definiendo",
];

const STEP_TITLES = ["¿Qué necesitas?", "¿Presupuesto aproximado?", "Tus datos"];

export function Contact({ config = {} }: ContactProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;

  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formState, setFormState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  // Wizard: 3 pasos que se intercambian en el mismo envelope compacto
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [refTyped, setRefTyped] = useState("");

  const phoneNumber = c("contact_whatsapp", "584262931869");
  const referralCode = useReferralCode();
  const whatsappMessage = encodeURIComponent(
    appendReferralCode(
      c("contact_whatsapp_message", "¡Hola Caskiuz! 👋 Me gustaría conversar sobre un proyecto."),
      referralCode
    )
  );
  const emailContact = c("contact_email", "rijarwow@gmail.com");
  const linkedinUrl = c("contact_linkedin_url", "https://www.linkedin.com/in/ricardo-agelvis-9489a9370");

  const canContinue =
    (step === 1 && Boolean(category)) ||
    (step === 2 && Boolean(budget)) ||
    (step === 3 && name.trim() && email.trim() && message.trim());

  async function handleSubmit() {
    if (!canContinue || formState === "submitting") return;
    setFormState("submitting");

    const categoryLabel = SERVICE_OPTIONS.find((s) => s.value === category)?.label || category;
    const composed = `Categoría: ${categoryLabel}\nPresupuesto: ${budget}\n\n${message.trim()}`;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          service: category,
          message: composed,
          refCode: refTyped.trim() || referralCode || undefined,
          source: "FORM",
        }),
      });

      if (!res.ok) throw new Error("Error al enviar");
      setFormState("success");
      setTimeout(() => {
        setFormState("idle");
        setStep(1);
        setCategory("");
        setBudget("");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      }, 12000);
    } catch {
      setFormState("error");
      setTimeout(() => setFormState("idle"), 5000);
    }
  }

  return (
    <section ref={ref} id="contact" className="relative py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-sm font-semibold text-aff-cyan uppercase tracking-wider">
            {c("contact_label", "Contacto")}
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            ¿Listo para <span className="metal-text">{c("contact_title", "empezar")}</span>?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {c("contact_subtitle", "3 pasos rápidos y recibo tu propuesta preliminar. La primera consulta es gratis.")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact info cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 space-y-3"
          >
            {/* WhatsApp card */}
            <Link
              href={`https://wa.me/${phoneNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-card spotlight-card p-4 hover:scale-[1.02] transition-transform group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {c("contact_whatsapp_card_title", "WhatsApp Directo")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {c("contact_whatsapp_card_subtitle", "Respuesta en minutos")}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#25D366] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Email card */}
            <Link
              href={`mailto:${emailContact}`}
              className="block glass-card spotlight-card p-4 hover:scale-[1.02] transition-transform group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-aff-cyan/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-aff-cyan" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Email</h4>
                  <p className="text-sm text-muted-foreground">{emailContact}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-aff-cyan group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Availability */}
            <div className="glass-card spotlight-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-aff-cyan/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-aff-cyan" />
                </div>
                <div>
                  <h4 className="font-semibold">Disponibilidad</h4>
                  <p className="text-sm text-muted-foreground">
                    {c("contact_availability", "Lunes a Viernes, 9AM - 6PM (GMT-4)")}
                  </p>
                </div>
              </div>
            </div>

            {/* LinkedIn card */}
            {linkedinUrl && (
              <Link
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block glass-card spotlight-card p-4 hover:scale-[1.02] transition-transform group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-[#0A66C2]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">LinkedIn</h4>
                    <p className="text-sm text-muted-foreground">
                      {c("contact_linkedin_label", "Conecta conmigo")}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#0A66C2] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )}

            {/* Location */}
            <div className="glass-card spotlight-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold">Ubicación</h4>
                  <p className="text-sm text-muted-foreground">
                    {c("contact_location", "Remoto — Trabajo con clientes de todo el mundo")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Wizard de contacto */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-card spotlight-card p-5 sm:p-6">
              {formState === "error" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">¡Oops! Algo salió mal</h3>
                  <p className="text-muted-foreground mb-6">
                    No se pudo enviar el mensaje. Por favor, inténtalo de nuevo o escríbeme directamente por WhatsApp.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setFormState("idle")}
                      className="px-6 py-3 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-full transition-all"
                    >
                      Intentar de nuevo
                    </button>
                    <Link
                      href={`https://wa.me/${phoneNumber}?text=${whatsappMessage}`}
                      target="_blank"
                      className="px-6 py-3 text-sm font-medium text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full transition-all"
                    >
                      <MessageCircle className="w-4 h-4 inline mr-1.5" />
                      WhatsApp
                    </Link>
                  </div>
                </motion.div>
              ) : formState === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">¡Listo, {name.split(" ")[0]}! 🎉</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Tu solicitud llegó. En minutos te llega un email con una{" "}
                    <span className="text-aff-cyan font-medium">propuesta preliminar preparada con IA</span>{" "}
                    y luego te contacto personalmente (menos de 24h).
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                    <Link
                      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(appendReferralCode(`¡Hola Caskiuz! Soy ${name.split(" ")[0]}. Acabo de enviar el formulario (${category}${budget ? `, presupuesto ${budget}` : ""}) y quiero adelantar la conversación.`, referralCode))}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-6 py-3 text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full font-medium transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Adelantar por WhatsApp
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div>
                  {/* Progreso */}
                  <div className="flex items-center gap-2 mb-5">
                    {STEP_TITLES.map((title, i) => (
                      <div key={title} className="flex items-center gap-2 flex-1 last:flex-none">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            step === i + 1
                              ? "bg-gradient-to-br from-aff-blue-deep to-aff-blue text-white shadow-lg shadow-aff-blue/30"
                              : step > i + 1
                                ? "bg-aff-cyan/15 text-aff-cyan"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {step > i + 1 ? "✓" : i + 1}
                        </span>
                        <span
                          className={`text-xs hidden sm:inline ${
                            step === i + 1 ? "text-foreground font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {title}
                        </span>
                        {i < STEP_TITLES.length - 1 && (
                          <span className="h-px flex-1 bg-border min-w-4" />
                        )}
                      </div>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h3 className="text-lg font-bold mb-1">¿Qué necesitas?</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Elige lo más parecido — luego lo afinamos juntos.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {SERVICE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setCategory(opt.value)}
                              className={`px-4 py-3 rounded-xl text-left text-sm font-medium border transition-all duration-200 cursor-pointer ${
                                category === opt.value
                                  ? "border-aff-cyan bg-aff-cyan/10 text-aff-cyan shadow-lg shadow-aff-cyan/10"
                                  : "border-border bg-surface hover:border-aff-cyan/40 hover:bg-surface-hover"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h3 className="text-lg font-bold mb-1">¿Presupuesto aproximado?</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Con esto preparo una propuesta realista. Nadie te juzga por el número 😉
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {BUDGET_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setBudget(opt)}
                              className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${
                                budget === opt
                                  ? "border-aff-cyan bg-aff-cyan/10 text-aff-cyan shadow-lg shadow-aff-cyan/10"
                                  : "border-border bg-surface hover:border-aff-cyan/40 hover:bg-surface-hover"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h3 className="text-lg font-bold mb-1">Tus datos</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Última parte — con esto te preparo la propuesta preliminar.
                        </p>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Tu nombre *"
                              maxLength={60}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan focus:ring-2 focus:ring-aff-cyan/20 outline-none transition-all text-sm"
                            />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Email *"
                              maxLength={80}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan focus:ring-2 focus:ring-aff-cyan/20 outline-none transition-all text-sm"
                            />
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="WhatsApp con código de país (opcional)"
                            maxLength={40}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan focus:ring-2 focus:ring-aff-cyan/20 outline-none transition-all text-sm"
                          />
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            placeholder="Cuéntame de tu negocio y qué quieres lograr… *"
                            maxLength={1500}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan focus:ring-2 focus:ring-aff-cyan/20 outline-none transition-all text-sm resize-none"
                          />
                          <input
                            type="text"
                            value={refTyped}
                            onChange={(e) => setRefTyped(e.target.value)}
                            placeholder="¿Te recomendó alguien? Código de referido (opcional)"
                            maxLength={60}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan focus:ring-2 focus:ring-aff-cyan/20 outline-none transition-all text-sm"
                          />
                          {/* Honeypot anti-bots: invisible para humanos */}
                          <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            className="hidden"
                            aria-hidden="true"
                          />
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-aff-cyan" />
                            Al enviar, una IA prepara tu propuesta preliminar y la recibes por email.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navegación del wizard */}
                  <div className="flex items-center justify-between gap-3 mt-6">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep((s) => s - 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-surface-hover transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" /> Atrás
                      </button>
                    ) : (
                      <span />
                    )}
                    {step < 3 ? (
                      <button
                        type="button"
                        disabled={!canContinue}
                        onClick={() => setStep((s) => s + 1)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold btn-aff disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Continuar <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canContinue || formState === "submitting"}
                        onClick={handleSubmit}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold btn-aff disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {formState === "submitting" ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="inline-flex"
                            >
                              <Send className="w-4 h-4" />
                            </motion.span>
                            Preparando propuesta…
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Enviar y recibir propuesta
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
