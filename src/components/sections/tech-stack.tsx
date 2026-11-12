"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";

const techCategories = [
  {
    category: "Frontend & Mobile",
    icon: "⚛️",
    items: [
      { name: "React", icon: "⚛️" },
      { name: "Next.js", icon: "▲" },
      { name: "TypeScript", icon: "🔷" },
      { name: "JavaScript", icon: "🟨" },
      { name: "TailwindCSS", icon: "🎨" },
      { name: "HTML / CSS", icon: "🌐" },
      { name: "React Native", icon: "📱" },
      { name: "Expo", icon: "🏗️" },
      { name: "Flutter / Dart", icon: "💙" },
      { name: "Blade / Bootstrap", icon: "📄" },
      { name: "Framer Motion", icon: "🎬" },
      { name: "Radix UI", icon: "🧩" },
      { name: "Lucide React", icon: "🪶" },
      { name: "shadcn/ui", icon: "🎯" },
    ],
  },
  {
    category: "Backend & APIs",
    icon: "🟢",
    items: [
      { name: "Node.js", icon: "🟢" },
      { name: "Express.js", icon: "⚡" },
      { name: "PHP", icon: "🐘" },
      { name: "Laravel", icon: "🔥" },
      { name: "Python", icon: "🐍" },
      { name: "Django / DRF", icon: "🧩" },
      { name: "MySQL", icon: "🐬" },
      { name: "PostgreSQL", icon: "🗄️" },
      { name: "Prisma ORM", icon: "🔺" },
      { name: "REST APIs", icon: "🔗" },
      { name: "GraphQL", icon: "◈" },
      { name: "Microservicios", icon: "🏘️" },
    ],
  },
  {
    category: "DevOps & Cloud",
    icon: "🐳",
    items: [
      { name: "Docker", icon: "🐳" },
      { name: "Git / GitHub", icon: "📦" },
      { name: "GitHub Actions", icon: "⚙️" },
      { name: "Vercel", icon: "⬆️" },
      { name: "Render", icon: "☁️" },
      { name: "AWS", icon: "☁️" },
      { name: "Linux / Ubuntu", icon: "🐧" },
      { name: "CI/CD", icon: "🔄" },
      { name: "HTTPS / SSL", icon: "🔒" },
      { name: "Hosting Compartido", icon: "🏠" },
    ],
  },
  {
    category: "Pagos, Web3 & Más",
    icon: "💳",
    items: [
      { name: "Stripe", icon: "💳" },
      { name: "Twilio", icon: "📞" },
      { name: "Web3 / DApps", icon: "⛓️" },
      { name: "BNB Chain", icon: "💎" },
      { name: "Smart Contracts", icon: "📜" },
      { name: "WebSockets", icon: "🔌" },
      { name: "GPS / Mapas", icon: "📍" },
      { name: "Resend (Email)", icon: "✉️" },
      { name: "SEO / PWA", icon: "📊" },
      { name: "MDX / Blog", icon: "📝" },
      { name: "Prism / Syntax", icon: "🖍️" },
      { name: "Octokit / GitHub API", icon: "🐙" },
    ],
  },
];

export function TechStack() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="tech-stack" className="relative py-24 sm:py-32">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-aff-cyan uppercase tracking-wider">
            Tech Stack
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Tecnologías que <span className="metal-text">domino</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stack completo para construir productos digitales robustos, escalables
            y con experiencia de usuario excepcional.
          </p>
          <p className="mt-3 text-xs text-muted-foreground/70">
            Toca una categoría para ver las tecnologías 👇
          </p>
        </motion.div>

        {/* Acordeones por categoría — colapsados por defecto para ahorrar espacio */}
        <div className="max-w-4xl mx-auto space-y-4">
          {techCategories.map((cat, ci) => (
            <motion.details
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: ci * 0.1 }}
              className="glass-card spotlight-card group rounded-2xl overflow-hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 transition-colors hover:bg-surface-hover/50 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-aff-cyan/10 text-xl">
                    {cat.icon}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">{cat.category}</h3>
                    <p className="text-xs text-muted-foreground">
                      {cat.items.length} tecnologías
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
              </summary>

              <div className="px-5 sm:px-6 pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cat.items.map((item, ii) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.25, delay: ci * 0.1 + ii * 0.03 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl glass-card hover:bg-surface-hover transition-all duration-200 cursor-default"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
