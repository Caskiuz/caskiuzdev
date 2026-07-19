"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  MessageCircle,
  Mail,
  MapPin,
  Send,
  Clock,
  CheckCircle2,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formState, setFormState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const phoneNumber = "584262931869";
  const whatsappMessage = encodeURIComponent(
    "¡Hola Caskiuz! 👋 Me gustaría conversar sobre un proyecto."
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("submitting");

    // Simular envío (placeholder para API route)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setFormState("success");

    setTimeout(() => setFormState("idle"), 3000);
  };

  return (
    <section ref={ref} id="contact" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Contacto
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            ¿Listo para <span className="gradient-text">empezar</span>?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Cuéntame sobre tu proyecto y te responderé en menos de 24 horas. La
            primera consulta es gratis.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* WhatsApp card */}
            <Link
              href={`https://wa.me/${phoneNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-card p-5 hover:scale-[1.02] transition-transform group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#25D366]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">WhatsApp Directo</h4>
                  <p className="text-sm text-muted-foreground">
                    Respuesta en minutos
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#25D366] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Email card */}
            <Link
              href="mailto:hola@caskiuz.dev"
              className="block glass-card p-5 hover:scale-[1.02] transition-transform group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Email</h4>
                  <p className="text-sm text-muted-foreground">
                    hola@caskiuz.dev
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Availability */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">Disponibilidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Lunes a Viernes, 9AM - 6PM (GMT-4)
                  </p>
                </div>
              </div>
            </div>

            {/* LinkedIn card */}
            <Link
              href="https://www.linkedin.com/in/ricardo-agelvis-9489a9370"
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-card p-5 hover:scale-[1.02] transition-transform group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#0A66C2]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">LinkedIn</h4>
                  <p className="text-sm text-muted-foreground">
                    Conecta conmigo
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#0A66C2] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Location */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold">Ubicación</h4>
                  <p className="text-sm text-muted-foreground">
                    Remoto — Trabajo con clientes de todo el mundo
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-6 sm:p-8">
              {formState === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">¡Mensaje enviado!</h3>
                  <p className="text-muted-foreground">
                    Te responderé lo antes posible. Mientras tanto, ¿por qué no me
                    escribes por WhatsApp?
                  </p>
                  <Link
                    href={`https://wa.me/${phoneNumber}?text=${whatsappMessage}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full font-medium transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Abrir WhatsApp
                  </Link>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-2"
                      >
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        placeholder="Tu nombre"
                        className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="service"
                      className="block text-sm font-medium mb-2"
                    >
                      ¿Qué servicio te interesa?
                    </label>
                    <select
                      id="service"
                      name="service"
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm cursor-pointer"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="web">Desarrollo Web</option>
                      <option value="mobile">Desarrollo Mobile</option>
                      <option value="api">API / Backend</option>
                      <option value="consulting">Consultoría</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-2"
                    >
                      Cuéntame sobre tu proyecto
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Describe tu idea, objetivos, presupuesto..."
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formState === "submitting"}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-all duration-200 shadow-xl shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60"
                  >
                    {formState === "submitting" ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Send className="w-5 h-5" />
                        </motion.div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar mensaje
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}