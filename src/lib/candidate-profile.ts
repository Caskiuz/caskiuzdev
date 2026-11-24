/**
 * Perfil canónico del candidato para el hub de empleo (scoring de vacantes,
 * cartas de presentación y página /cv). Fuente única de verdad — se actualiza
 * en código cuando cambie el CV o los proyectos.
 */

export const candidateProfile = {
  name: "Ricardo José Agelvis Requiniva",
  displayName: "Ricardo Agelvis (Caskiuz)",
  headline: "Desarrollador Full-Stack & Automatización IA · Next.js · Node.js · Python",
  location: "Táchira, Venezuela (Remoto global)",
  summary:
    "Desarrollador Full-Stack e Ingeniero de Sistemas con 6+ años de experiencia construyendo productos digitales de extremo a extremo. Especializado en el ecosistema JavaScript/TypeScript (React, Next.js, Node.js) y Python (Django, FastAPI, Machine Learning), con automatización de procesos con IA: chatbots de WhatsApp, workflows n8n y agentes con Gemini.",
  salaryFloorUsd: 1500, // mínimo aceptable mensual (USD)
  languages: ["Español (nativo)", "Inglés (profesional)"],
  links: {
    portfolio: "https://caskiuz.vercel.app",
    cv: "https://caskiuz.vercel.app/cv",
    github: "https://github.com/Caskiuz",
    linkedin: "https://www.linkedin.com/in/ricardo-agelvis-9489a9370",
    torre: "https://torre.ai/ricardojoseagelvisrequiniva",
  },
  /** Keywords de los roles que busca — se usan para pre-filtrar vacantes. */
  roleKeywords: [
    "full-stack",
    "fullstack",
    "full stack",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "react",
    "next.js",
    "nextjs",
    "node",
    "typescript",
    "javascript",
    "python",
    "django",
    "fastapi",
    "automation",
    "automatización",
    "ai engineer",
    "integración ia",
    "chatbot",
    "n8n",
    "llm",
    "api",
  ],
  skills: [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Python",
    "Django",
    "FastAPI",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Prisma ORM",
    "REST APIs",
    "GraphQL",
    "Docker",
    "AWS",
    "Vercel",
    "Linux",
    "TailwindCSS",
    "React Native",
    "Ionic",
    "Machine Learning",
    "Scikit-learn",
    "TensorFlow",
    "n8n",
    "Gemini API",
    "OpenAI API",
    "Appian (BPM/Low-Code)",
    "RPA",
    "WebSockets",
    "SEO técnico",
    "GA4",
  ],
  experience: [
    {
      title: "Desarrollador Full-Stack & Automatización IA",
      company: "Caskiuz (Freelance)",
      period: "Ene 2025 — Actual",
      description:
        "Fundé y dirijo Caskiuz: webs, apps y automatizaciones con IA para empresas de Latinoamérica y España. Chatbots de WhatsApp con IA, workflows n8n, prospección automática con Gemini y agentes de voz. SEO técnico y analítica.",
    },
    {
      title: "Programador Full Stack",
      company: "RentameCarmen",
      period: "Ene 2024 — Ene 2025",
      description:
        "Aplicaciones web y móviles (Ionic) para gestión de equipos de maquinaria: arquitectura back-end, bases de datos SQL/NoSQL, APIs RESTful, inventarios y geolocalización.",
    },
    {
      title: "Ingeniero de Software",
      company: "ELGESTORMX",
      period: "Ene 2024 — Ene 2025",
      description:
        "Soluciones de gestión documental: módulos front-end/back-end, generación de PDFs, integración con APIs gubernamentales y paneles de administración.",
    },
    {
      title: "Ingeniero Senior de Software",
      company: "INTELIDATA CORP",
      period: "Ene 2023 — Ene 2024",
      description:
        "Plataforma de análisis predictivo para fintech: back-end Python/Django, front-end React, modelos de riesgo crediticio con Scikit-learn/TensorFlow y APIs en tiempo real en la nube.",
    },
    {
      title: "Desarrollador Certificado Appian",
      company: "BPM Solutions Group",
      period: "Ene 2020 — Ene 2024",
      description:
        "Automatización de procesos de negocio (BPM): apps empresariales en Appian para onboarding y compliance, interfaces SAIL, integraciones REST/SOAP y RPA.",
    },
  ],
  projects: [
    {
      name: "Caskiuz Portfolio & Hub de automatización",
      url: "https://caskiuz.vercel.app",
      description:
        "Portfolio Next.js con chatbot IA, prospección automática verificada, blog SEO, newsletter y programa de afiliados completo.",
    },
    {
      name: "Los Árabes Food",
      url: "https://losarabesfood.vercel.app",
      description:
        "Web de restaurante con menú interactivo, paquetes y carrito que envía pedidos directo a WhatsApp (Next.js + Tailwind).",
    },
    {
      name: "Turbo Steven Audio",
      url: "https://turbosteven.vercel.app",
      description:
        "Sistema de gestión de comandas de fabricación: pedidos con numeración automática, estados en tiempo real, roles Admin/Vendedor/Taller, PDFs y asistente IA.",
    },
    {
      name: "René Couder — Filmmaker",
      url: "https://renecouder.vercel.app",
      description:
        "Portfolio profesional de filmmaker y fotógrafo de conciertos: showreel, videoteca con filtros, galerías y SEO en español.",
    },
    {
      name: "Nexus Impertodo",
      url: "https://nexus-impertodo.vercel.app",
      description: "Plataforma de subastas/e-commerce con paneles y flujos automatizados.",
    },
    {
      name: "ComeYa",
      url: "https://comeya.es",
      description:
        "Sistema web/app de delivery en Soria, España: pedidos con GPS, repartidores y administración.",
    },
  ],
  education: [
    {
      title: "Ingeniería en Sistemas Computacionales",
      institution: "Universidad Fermín Toro",
      period: "2009 — 2014",
    },
    {
      title: "Especialización en Machine Learning (Python/TensorFlow)",
      institution: "Coursera / edX",
      period: "2023 — 2024",
    },
    {
      title: "Desarrollo y especialización en Appian (LCNC/BPM)",
      institution: "Appian Academy",
      period: "2020 — 2023",
    },
  ],
} as const;

/** Perfil compacto para prompts de IA (scoring y cartas). */
export function profilePromptBlock(): string {
  return `PERFIL DEL CANDIDATO:
- ${candidateProfile.headline}
- Ubicación: ${candidateProfile.location}
- Mínimo salarial: $${candidateProfile.salaryFloorUsd} USD/mes
- Skills: ${candidateProfile.skills.join(", ")}
- Experiencia: ${candidateProfile.experience.map((e) => `${e.title} en ${e.company} (${e.period})`).join("; ")}
- Proyectos: ${candidateProfile.projects.map((p) => `${p.name} (${p.url})`).join("; ")}
- Portfolio: ${candidateProfile.links.portfolio} · GitHub: ${candidateProfile.links.github} · LinkedIn: ${candidateProfile.links.linkedin}`;
}
