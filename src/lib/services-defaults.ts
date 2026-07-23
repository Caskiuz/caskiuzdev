export interface ServiceItem {
  id: string;
  icon?: string;
  title: string;
  description: string;
  price: string;
  category: string;
  features: string[];
  popular: boolean;
  deliveryTime?: string;
}

export const defaultServices: ServiceItem[] = [
  {
    id: "s1", icon: "Globe", title: "Web Apps",
    description: "Aplicaciones web full-stack con React, Next.js y TypeScript. Código 100% custom, sin plantillas. Consultoría inicial GRATIS incluida.",
    price: "Desde $350 USD", category: "desarrollo",
    features: ["Next.js / React SPA", "TypeScript + SSR/ISG", "SEO optimizado", "Pago 50% inicio / 50% entrega"],
    popular: true,
    deliveryTime: "2-4 semanas",
  },
  {
    id: "s2", icon: "Smartphone", title: "Mobile Apps",
    description: "Apps nativas y multiplataforma con React Native y Expo. Versión MVP desde precio base; funcionalidades extra ajustan el valor.",
    price: "Desde $800 USD", category: "desarrollo",
    features: ["iOS + Android (MVP)", "Expo managed workflow", "Push notifications", "Financiamiento por hitos"],
    popular: false,
    deliveryTime: "4-8 semanas",
  },
  {
    id: "s3", icon: "Server", title: "APIs & Backend",
    description: "APIs RESTful y GraphQL con Node.js, Express, MySQL. Escala con la complejidad del proyecto.",
    price: "Desde $300 USD", category: "desarrollo",
    features: ["REST / GraphQL APIs", "MySQL / PostgreSQL", "Autenticación JWT/OAuth", "Arquitectura escalable"],
    popular: false,
    deliveryTime: "2-6 semanas",
  },
  {
    id: "s4", icon: "Zap", title: "Landing Pages",
    description: "Landing pages de alto rendimiento con código custom. Sin plantillas WordPress — velocidad y SEO real. El gancho perfecto para tu negocio.",
    price: "Desde $150 USD", category: "desarrollo",
    features: ["Next.js + TailwindCSS", "Animaciones Framer Motion", "SEO 100% optimizado", "Formulario con WhatsApp/Email"],
    popular: false,
    deliveryTime: "1-2 semanas",
  },
  {
    id: "s5", icon: "Rocket", title: "SaaS MVP",
    description: "Producto mínimo viable para startups. Valida tu idea en semanas. El precio final depende de funcionalidades.",
    price: "Desde $1,000 USD", category: "producto",
    features: ["Auth + Roles de usuario", "Stripe / MercadoPago", "Dashboard administrativo", "Financiamiento 50/50"],
    popular: true,
    deliveryTime: "4-8 semanas",
  },
  {
    id: "s6", icon: "ShoppingCart", title: "E-commerce",
    description: "Tiendas online con carrito, pagos y panel de administración. Precio base para catálogo simple; crece con tu inventario.",
    price: "Desde $1,000 USD", category: "producto",
    features: ["Stripe / MercadoPago", "Gestión de inventario", "Carrito + Checkout", "Pago en 3 hitos"],
    popular: false,
    deliveryTime: "4-12 semanas",
  },
  {
    id: "s7", icon: "BarChart3", title: "Dashboards & CRM",
    description: "Paneles administrativos y CRMs a medida. Precio gancho para dashboards básicos; se ajusta con funcionalidades avanzadas.",
    price: "Desde $350 USD", category: "producto",
    features: ["Gráficos interactivos", "Exportación CSV/PDF", "Roles y permisos", "Pago 50% inicio / 50% entrega"],
    popular: false,
    deliveryTime: "3-6 semanas",
  },
  {
    id: "s8", icon: "Bot", title: "Integración IA",
    description: "Conecta tu producto a OpenAI, Claude o la IA que necesites. Chatbots, generadores de contenido, análisis. Precio de entrada inmejorable.",
    price: "Desde $150 USD", category: "producto",
    features: ["ChatGPT / Claude API", "Chatbots inteligentes", "Generación de contenido", "Análisis de sentimiento"],
    popular: false,
    deliveryTime: "1-4 semanas",
  },
  {
    id: "s9", icon: "Headset", title: "Mantenimiento & Soporte",
    description: "Hosting, backups, actualizaciones y una bolsa de horas mensual para cambios. Paga solo por lo que necesitas.",
    price: "Desde $80 USD/mes", category: "consultoria",
    features: ["Hosting + Dominio incluido", "3h de cambios/soporte al mes", "Backups automáticos", "Actualizaciones de seguridad"],
    popular: true,
    deliveryTime: "Continuo",
  },
  {
    id: "seo1", icon: "Search", title: "Auditoría SEO Completa",
    description: "Análisis técnico, on-page y de competencia con reporte detallado. Descubrí exactamente qué impide que tu sitio aparezca en Google.",
    price: "Desde $199 USD", category: "seo",
    features: ["Reporte técnico + on-page + competencia", "Análisis de Core Web Vitals", "Plan de acción priorizado (PDF)", "Consultoría 1h para revisar hallazgos"],
    popular: true,
    deliveryTime: "1-2 semanas",
  },
  {
    id: "seo2", icon: "Zap", title: "SEO On-Page + Velocidad",
    description: "Optimización de meta tags, headings, schema markup y rendimiento. Tu sitio pasará de lento a volar en los resultados de búsqueda.",
    price: "Desde $299 USD", category: "seo",
    features: ["Meta tags + headings optimizados", "Schema markup (JSON-LD)", "Lighthouse ≥ 90 garantizado", "Core Web Vitals en verde"],
    popular: false,
    deliveryTime: "2-3 semanas",
  },
  {
    id: "seo3", icon: "MapPin", title: "SEO Local (Google My Business)",
    description: "Perfil de negocio verificado, optimizado y conectado a tu web. Aparecé en el mapa cuando tus clientes te busquen.",
    price: "Desde $199 USD", category: "seo",
    features: ["Perfil GMB verificado y optimizado", "Fotos, horarios, servicios configurados", "Vinculación con tu sitio web", "Estrategia de reseñas locales"],
    popular: false,
    deliveryTime: "1-2 semanas",
  },
  {
    id: "seo4", icon: "BarChart3", title: "Keyword Research + Contenido",
    description: "Investigación de palabras clave rentables + artículos listos para publicar. Atrae tráfico que convierte.",
    price: "Desde $249 USD", category: "seo",
    features: ["30+ keywords con volumen y dificultad", "Análisis de intención de búsqueda", "2 artículos optimizados listos para publicar", "Estrategia de contenidos a 3 meses"],
    popular: false,
    deliveryTime: "2-3 semanas",
  },
];

export const serviceCategories = [
  { key: "desarrollo", label: "🏗️ Desarrollo" },
  { key: "producto", label: "🚀 Producto" },
  { key: "consultoria", label: "🔧 Consultoría" },
  { key: "seo", label: "🔍 SEO Web" },
];

/**
 * Merge DB services with defaults. DB services take priority by ID.
 * New defaults not yet in DB are appended so they appear automatically.
 */
export function mergeServices(dbServices: ServiceItem[]): ServiceItem[] {
  if (dbServices.length === 0) return defaultServices;
  const dbIds = new Set(dbServices.map((s) => s.id));
  const newDefaults = defaultServices.filter((s) => !dbIds.has(s.id));
  return [...dbServices, ...newDefaults];
}