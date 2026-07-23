"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, TrendingUp, Globe, ShoppingCart, Zap } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company?: string;
  content: string;
  result: string;
  rating: number;
  icon: React.ComponentType<any>;
}

const testimonials: Testimonial[] = [
  {
    name: "María González",
    role: "Fundadora",
    company: "Boutique Online",
    content:
      "Caskiuz transformó completamente nuestra presencia digital. Pasamos de vender por Instagram a tener una tienda online profesional. Su atención al detalle y rapidez son increíbles.",
    result: "Ventas online aumentaron 300% en 3 meses",
    rating: 5,
    icon: ShoppingCart,
  },
  {
    name: "Carlos Mendoza",
    role: "CEO",
    company: "TechStart LATAM",
    content:
      "Contratamos a Caskiuz para nuestro SaaS MVP y en 6 semanas teníamos un producto funcional con usuarios reales. Profesional, puntual y excelente comunicación.",
    result: "MVP validado con 200+ usuarios beta en 2 meses",
    rating: 5,
    icon: Zap,
  },
  {
    name: "Ana Rodríguez",
    role: "Marketing Lead",
    company: "Agencia Creativa",
    content:
      "Su trabajo de SEO on-page y optimización de velocidad nos llevó de la posición #28 a #3 en Google. El tráfico orgánico se duplicó en 60 días. Resultados reales.",
    result: "Posicionamiento #3 en Google para keyword principal",
    rating: 5,
    icon: TrendingUp,
  },
  {
    name: "Pedro Ruiz",
    role: "Emprendedor",
    company: "E-commerce Independiente",
    content:
      "Necesitaba mi tienda online rápido y con pagos integrados. Caskiuz me entregó en tiempo récord y con una calidad que no esperaba por el precio. Súper recomendado.",
    result: "Tienda funcional con MercadoPago en 2 semanas",
    rating: 5,
    icon: Globe,
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
            Resultados reales de emprendedores y empresas que confiaron en mi trabajo.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {testimonials.map((t, i) => {
            const IconComp = t.icon;
            return (
              <motion.div
                key={i}
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
                </div>

                {/* Content */}
                <p className="text-foreground leading-relaxed mb-6 relative z-10">
                  &ldquo;{t.content}&rdquo;
                </p>

                {/* Result badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-sm font-medium text-green-600 dark:text-green-400 mb-5">
                  <IconComp className="w-3.5 h-3.5" />
                  {t.result}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role}{t.company ? ` · ${t.company}` : ""}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}