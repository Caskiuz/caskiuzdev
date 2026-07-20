"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, Briefcase, GraduationCap, Heart, MapPin, Coffee } from "lucide-react";

interface AboutProps {
  config?: Record<string, string>;
}

export function About({ config = {} }: AboutProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;

  const timeline = [
    {
      year: c("about_tl_1_year", "2024 — Presente"),
      title: c("about_tl_1_title", "Senior Full-Stack Developer"),
      company: c("about_tl_1_company", "Freelance Internacional"),
      description: c("about_tl_1_desc", "Desarrollo de aplicaciones web y mobile para clientes en USA, Europa y Latinoamérica. Arquitectura de soluciones cloud-native."),
      icon: Code2,
    },
    {
      year: c("about_tl_2_year", "2022 — 2024"),
      title: c("about_tl_2_title", "Full-Stack Developer"),
      company: c("about_tl_2_company", "Agencia Digital TechCo"),
      description: c("about_tl_2_desc", "Lideré el equipo de frontend en proyectos React/Next.js. Implementé CI/CD pipelines y migraciones a TypeScript."),
      icon: Briefcase,
    },
    {
      year: c("about_tl_3_year", "2020 — 2022"),
      title: c("about_tl_3_title", "Backend Developer"),
      company: c("about_tl_3_company", "Startup Fintech"),
      description: c("about_tl_3_desc", "Diseñé e implementé APIs RESTful con Node.js y MySQL. Construí microservicios para procesamiento de pagos."),
      icon: GraduationCap,
    },
  ];

  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="about" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            {c("about_label", "Sobre mí")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Mi <span className="gradient-text">{c("about_title", "historia")}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left - Bio */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="glass-card p-8">
              <h3 className="text-2xl font-bold mb-4">
                {c("about_bio_title", "Más allá del")}{" "}
                <span className="gradient-text">{c("about_bio_title_highlight", "código")}</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {c("about_bio_p1", "Soy un desarrollador full-stack apasionado por crear productos digitales que marcan la diferencia. Mi enfoque combina excelencia técnica con pensamiento estratégico, asegurando que cada línea de código contribuya al éxito del negocio.")}
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {c("about_bio_p2", "Me especializo en el ecosistema React/Next.js para frontend y Node.js/MySQL para backend, con experiencia en arquitecturas serverless, microservicios y despliegues en la nube.")}
              </p>

              {/* Quick facts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {c("about_quick_location_label", "Ubicación")}
                    </div>
                    <div className="text-sm font-medium">
                      {c("about_quick_location_value", "Remoto Global")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                  <Coffee className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {c("about_quick_avail_label", "Disponible")}
                    </div>
                    <div className="text-sm font-medium">
                      {c("about_quick_avail_value", "Full-Time")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="relative pl-12"
              >
                {/* Timeline line */}
                {i < timeline.length - 1 && (
                  <div className="absolute left-[19px] top-12 bottom-0 w-px bg-border" />
                )}

                {/* Timeline dot */}
                <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>

                <div className="glass-card p-5">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {item.year}
                  </span>
                  <h4 className="text-lg font-bold mt-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.company}</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}