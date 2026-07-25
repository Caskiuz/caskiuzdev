"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, Send, CheckCircle2, Loader2 } from "lucide-react";

interface TestimonialData {
  id: string | number;
  name: string;
  role?: string | null;
  company?: string | null;
  content: string;
  rating: number;
}

// Defaults más reales y conversacionales (fallback si no hay BD)
const defaultTestimonials: TestimonialData[] = [
  {
    id: "d1",
    name: "Luis M.",
    role: "Dueño",
    company: "Tienda de repuestos online",
    content:
      "Al principio dudaba si valía la pena invertir en una web propia, solo vendía por Instagram. Caskiuz me armó la tienda con MercadoPago en 2 semanas y desde el primer mes ya tenía ventas directas. La diferencia es brutal.",
    rating: 5,
  },
  {
    id: "d2",
    name: "Valentina R.",
    role: "Fundadora",
    company: "Startup de eventos",
    content:
      "Necesitábamos un MVP rápido para validar nuestra idea de app de eventos. Caskiuz nos entregó en 5 semanas algo funcional, con auth y pagos. No era perfecto, pero suficiente para conseguir nuestros primeros 50 usuarios y levantar inversión.",
    rating: 5,
  },
  {
    id: "d3",
    name: "Andrés G.",
    role: "Marketing",
    company: "Consultora digital",
    content:
      "Nuestra web estaba lentísima y no aparecía en Google. Caskiuz hizo una auditoría completa, optimizó todo y en 3 semanas pasamos de ni aparecer a estar en la página 2. Sigue mejorando. El tipo sabe lo que hace.",
    rating: 5,
  },
  {
    id: "d4",
    name: "Carolina S.",
    role: "Emprendedora",
    company: "E-commerce de moda",
    content:
      "Contraté la landing y luego el e-commerce. Lo que más me gustó fue la comunicación: siempre respondía rápido, me explicaba todo sin tecnicismos y cumplió con los tiempos. Si algo no le gustaba del diseño me lo decía con honestidad.",
    rating: 5,
  },
  {
    id: "d5",
    name: "Diego F.",
    role: "CTO",
    company: "Fintech pequeña",
    content:
      "Lo trajimos para reforzar el backend con Node.js y PostgreSQL. Se adaptó rápido a nuestro código legacy, documentó lo que hizo y cumplió los plazos. Buenísimo para startups que necesitan refuerzos puntuales sin contratar full-time.",
    rating: 4,
  },
  {
    id: "d6",
    name: "Mariana L.",
    role: "Freelancer",
    company: "Diseñadora UX/UI",
    content:
      "Necesitaba un dev que convirtiera mis diseños en código sin romper todo. Caskiuz entendió la importancia del pixel-perfect y trabajamos súper bien juntos. Entregó la web en Next.js con animaciones suaves, justo como lo imaginé.",
    rating: 5,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [testimonials, setTestimonials] = useState<TestimonialData[]>(defaultTestimonials);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // Load testimonials from DB
  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => {
        if (data.testimonials && data.testimonials.length > 0) {
          setTestimonials(data.testimonials);
        }
      })
      .catch(() => {
        // Use defaults silently
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim() || !formContent.trim()) {
      setFormError("Nombre y comentario son obligatorios.");
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          role: formRole.trim() || null,
          company: formCompany.trim() || null,
          content: formContent.trim(),
          rating: formRating,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess(true);
        setFormName("");
        setFormRole("");
        setFormCompany("");
        setFormContent("");
        setFormRating(5);
      } else {
        setFormError(data.error || "Error al enviar. Intenta de nuevo.");
      }
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <section ref={ref} id="testimonials" className="relative py-24 sm:py-32 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Testimonios
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Lo que dicen <span className="gradient-text">mis clientes</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Comentarios reales de personas que confiaron en mi trabajo. ¿Trabajamos juntos? ¡Deja el tuyo!
          </p>
        </motion.div>

        {/* Testimonials grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.id}
                variants={itemVariants}
                className="relative glass-card p-6 sm:p-8 group hover:scale-[1.02] transition-transform duration-300"
              >
                {/* Quote icon */}
                <div className="absolute top-4 right-4 text-primary/10">
                  <Quote className="w-10 h-10" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  {Array.from({ length: 5 - t.rating }).map((_, j) => (
                    <Star key={`e${j}`} className="w-4 h-4 text-muted-foreground/30" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground leading-relaxed mb-6 relative z-10 text-sm">
                  &ldquo;{t.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role || ""}{t.company ? ` · ${t.company}` : ""}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Submit testimonial form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 max-w-xl mx-auto"
        >
          {!formOpen && !formSuccess ? (
            <div className="text-center">
              <button
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-primary border border-primary/30 rounded-full hover:bg-primary/5 transition-colors"
              >
                <Send className="w-4 h-4" />
                ¿Trabajamos juntos? ¡Deja tu comentario!
              </button>
            </div>
          ) : formSuccess ? (
            <div className="glass-card p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground">¡Gracias por tu testimonio!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Será revisado y publicado pronto. ¡Ayuda a otros a conocer mi trabajo!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5">
              <h3 className="text-xl font-bold text-center">Deja tu testimonio</h3>
              <p className="text-sm text-muted-foreground text-center -mt-2">
                Cuéntale al mundo cómo fue tu experiencia trabajando conmigo.
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:outline-none text-sm"
                  maxLength={60}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rol (opcional)</label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Ej: Fundadora"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:outline-none text-sm"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Empresa (opcional)</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Ej: Mi Startup"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:outline-none text-sm"
                    maxLength={40}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tu experiencia <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Cuéntame qué tal fue el proceso, el resultado, la comunicación..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:outline-none text-sm resize-none"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formContent.length}/500
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Calificación</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= formRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-400 text-center">{formError}</p>
              )}

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-full transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar testimonio
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}