"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const techCategories = [
  {
    category: "Frontend & Mobile",
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(108,92,231,0.05),transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Tech Stack
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Tecnologías que <span className="gradient-text">domino</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stack completo para construir productos digitales robustos, escalables
            y con experiencia de usuario excepcional.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {techCategories.map((cat, ci) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: ci * 0.12 }}
              className="glass-card p-6 sm:p-8"
            >
              <h3 className="text-lg font-bold mb-6 text-center">
                {cat.category}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {cat.items.map((item, ii) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: ci * 0.12 + ii * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-all duration-200 cursor-default"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}