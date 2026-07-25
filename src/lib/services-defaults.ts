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
  // ─── 🏗️ Desarrollo ───
  {
    id: "s1",
    icon: "Globe",
    title: "Web Apps",
    description:
      "Aplicaciones web full-stack con React, Next.js y TypeScript. SSR, SSG, ISR — la estrategia correcta para cada caso.",
    price: "Desde $349 USD",
    category: "desarrollo",
    features: [
      "Next.js / React SPA",
      "Server Side Rendering",
      "SEO optimizado",
      "Responsive design",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: true,
    deliveryTime: "2-4 semanas",
  },
  {
    id: "s2",
    icon: "Smartphone",
    title: "Mobile Apps",
    description:
      "Apps nativas y multiplataforma con React Native y Expo. Una sola base de código para iOS y Android.",
    price: "Desde $799 USD",
    category: "desarrollo",
    features: [
      "iOS + Android",
      "Expo managed workflow",
      "Push notifications",
      "Offline-first",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "4-8 semanas",
  },
  {
    id: "s3",
    icon: "Server",
    title: "APIs & Backend",
    description:
      "APIs RESTful y GraphQL con Node.js, Express, MySQL y arquitecturas serverless escalables.",
    price: "Desde $299 USD",
    category: "desarrollo",
    features: [
      "REST / GraphQL APIs",
      "MySQL / PostgreSQL",
      "Autenticación JWT/OAuth",
      "Microservicios",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "2-6 semanas",
  },
  {
    id: "s4",
    icon: "Zap",
    title: "Landing Pages",
    description:
      "Landing pages de alto rendimiento optimizadas para conversión. Carga ultrarrápida, diseño premium y formularios integrados.",
    price: "Desde $149 USD",
    category: "desarrollo",
    features: [
      "Next.js + TailwindCSS",
      "Animaciones Framer Motion",
      "SEO 100% optimizado",
      "Formulario con WhatsApp/Email",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "1-2 semanas",
  },

  // ─── 🚀 Producto ───
  {
    id: "s5",
    icon: "Rocket",
    title: "SaaS MVP",
    description:
      "Producto mínimo viable para startups. Autenticación, pagos, dashboard y deploy en tiempo récord.",
    price: "Desde $999 USD",
    category: "producto",
    features: [
      "Auth + Roles de usuario",
      "Stripe / MercadoPago",
      "Dashboard administrativo",
      "Deploy en Vercel/AWS",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: true,
    deliveryTime: "4-8 semanas",
  },
  {
    id: "s6",
    icon: "ShoppingCart",
    title: "E-commerce",
    description:
      "Tiendas online completas con carrito, pagos integrados y panel de administración de productos.",
    price: "Desde $999 USD",
    category: "producto",
    features: [
      "Stripe / MercadoPago",
      "Gestión de inventario",
      "Carrito + Checkout",
      "SEO para productos",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "4-12 semanas",
  },
  {
    id: "s7",
    icon: "BarChart3",
    title: "Dashboards & CRM",
    description:
      "Paneles administrativos y CRMs a medida con gráficos, reportes y gestión de datos en tiempo real.",
    price: "Desde $349 USD",
    category: "producto",
    features: [
      "Gráficos interactivos",
      "Exportación CSV/PDF",
      "Roles y permisos",
      "Filtros avanzados",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "3-6 semanas",
  },
  {
    id: "s8",
    icon: "Bot",
    title: "Integración IA",
    description:
      "Agrega inteligencia artificial a tu producto: chatbots, generadores de contenido, análisis predictivo con OpenAI/Claude.",
    price: "Desde $149 USD",
    category: "producto",
    features: [
      "ChatGPT / Claude API",
      "Chatbots inteligentes",
      "Generación de contenido",
      "Análisis de sentimiento",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "1-4 semanas",
  },

  // ─── 🔧 Consultoría ───
  {
    id: "s9",
    icon: "Headset",
    title: "Mantenimiento & Soporte",
    description:
      "Paz mental para tu negocio. Hosting, backups, actualizaciones, monitoreo 24/7 y soporte técnico continuo.",
    price: "Desde $79 USD/mes",
    category: "consultoria",
    features: [
      "Hosting + Dominio",
      "Backups automáticos",
      "Actualizaciones de seguridad",
      "Soporte prioritario 24/7",
    ],
    popular: true,
    deliveryTime: "Continuo",
  },

  // ─── 🔍 SEO Web ───
  {
    id: "seo1",
    icon: "Search",
    title: "Auditoría SEO Completa",
    description:
      "Análisis técnico, on-page y de competencia con reporte detallado. Descubrí exactamente qué impide que tu sitio aparezca en Google.",
    price: "Desde $199 USD",
    category: "seo",
    features: [
      "Reporte técnico + on-page + competencia",
      "Análisis de Core Web Vitals",
      "Plan de acción priorizado (PDF)",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: true,
    deliveryTime: "1-2 semanas",
  },
  {
    id: "seo2",
    icon: "Zap",
    title: "SEO On-Page + Velocidad",
    description:
      "Optimización de meta tags, headings, schema markup y rendimiento. Tu sitio pasará de lento a volar en los resultados de búsqueda.",
    price: "Desde $299 USD",
    category: "seo",
    features: [
      "Meta tags + headings optimizados",
      "Schema markup (JSON-LD)",
      "Lighthouse ≥ 90 garantizado",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "2-3 semanas",
  },
  {
    id: "seo3",
    icon: "MapPin",
    title: "SEO Local (Google My Business)",
    description:
      "Perfil de negocio verificado, optimizado y conectado a tu web. Aparecé en el mapa cuando tus clientes te busquen.",
    price: "Desde $199 USD",
    category: "seo",
    features: [
      "Perfil GMB verificado y optimizado",
      "Fotos, horarios, servicios configurados",
      "Vinculación con tu sitio web",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "1-2 semanas",
  },
  {
    id: "seo4",
    icon: "BarChart3",
    title: "Keyword Research + Contenido",
    description:
      "Investigación de palabras clave rentables + artículos listos para publicar. Atrae tráfico que convierte.",
    price: "Desde $249 USD",
    category: "seo",
    features: [
      "30+ keywords con volumen y dificultad",
      "Análisis de intención de búsqueda",
      "2 artículos optimizados listos para publicar",
      "Pago 50% inicio / 50% entrega",
    ],
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