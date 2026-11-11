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

export interface MonthlyPlan {
  id: string;
  /** Grupo al que pertenece el plan. */
  group: "redes" | "prospeccion";
  /** Básico / Normal / Premium */
  name: string;
  /** Precio en USD por mes. */
  price: number;
  tagline: string;
  features: string[];
  popular?: boolean;
}

export const defaultServices: ServiceItem[] = [
  // ─── 🤖 Automatización & IA Empresarial ───
  // (la prospección con IA vive en los planes mensuales del grupo "prospeccion",
  //  se muestra al abrir esta categoría — no como card de servicio para no duplicar)
  {
    id: "a2",
    icon: "Workflow",
    title: "Workflows n8n & Integraciones",
    description:
      "Automatiza tus procesos internos de punta a punta: cotizaciones, facturación, correos, reportes y sincronización entre tus sistemas.",
    price: "Setup $199 + $29/mes",
    category: "automatizacion",
    features: [
      "Flujos de trabajo a medida en n8n",
      "Integración entre tus apps (CRM, ERP, email)",
      "Cotizaciones y facturas automáticas",
      "Reportes programados",
      "Hosting de los flujos y soporte incluidos",
      "Setup 50% inicio / 50% entrega · mensualidad por adelantado",
    ],
    popular: false,
    deliveryTime: "3-7 días",
  },
  {
    id: "a3",
    icon: "MessageSquare",
    title: "Chatbot de Ventas WhatsApp/Instagram",
    description:
      "Agente de IA que atiende, responde, cotiza, agenda y cobra 24/7 en WhatsApp e Instagram. Nunca más pierdas un cliente por demorar en contestar.",
    price: "Setup $199 + $49/mes",
    category: "automatizacion",
    features: [
      "Respuestas con IA (Gemini, Claude / OpenAI)",
      "WhatsApp + Instagram DM",
      "Cotiza y agenda citas solo",
      "Escalamiento a humano cuando hace falta",
      "500 conversaciones/mes incluidas (extra: $0.05/conv.)",
      "Twilio, tokens e infraestructura incluidos",
      "Setup 50% inicio / 50% entrega · mensualidad por adelantado",
    ],
    popular: false,
    deliveryTime: "5-10 días",
  },
  {
    id: "a4",
    icon: "Phone",
    title: "Agente de Voz IA",
    description:
      "Llamadas automatizadas con voz natural: confirmaciones de citas, recordatorios de pago, encuestas y seguimiento de clientes sin levantar el teléfono.",
    price: "Setup $99 + $99/mes",
    category: "automatizacion",
    features: [
      "Llamadas entrantes y salientes (Twilio)",
      "Voz natural en español",
      "Confirmaciones y recordatorios automáticos",
      "Transcripciones y resúmenes de cada llamada",
      "100 minutos/mes incluidos (minuto extra: $0.12)",
      "Voces, telefonía e infraestructura incluidas",
    ],
    popular: false,
    deliveryTime: "1-2 semanas",
  },
  {
    id: "a5",
    icon: "Eye",
    title: "Scraping & Monitoreo de Competencia",
    description:
      "Vigilamos a tus competidores por ti: precios, stock, promociones y anuncios, con alertas en tiempo real para que siempre vendas con ventaja.",
    price: "Setup $149 + $49/mes",
    category: "automatizacion",
    features: [
      "Monitoreo continuo diario de precios y stock",
      "Alertas de cambios de la competencia",
      "Seguimiento de anuncios y promociones",
      "Reportes automáticos",
      "Proxies e infraestructura incluidos",
      "Setup 50% inicio / 50% entrega · mensualidad por adelantado",
    ],
    popular: false,
    deliveryTime: "3-5 días",
  },
  {
    id: "a6",
    icon: "TrendingUp",
    title: "Dashboards con IA & Predicción de Ventas",
    description:
      "Paneles ejecutivos con tus KPIs en tiempo real, reportes automáticos y predicción de ventas con IA para decidir con datos, no con corazonadas.",
    price: "Setup $299 + $39/mes",
    category: "automatizacion",
    features: [
      "KPIs en tiempo real",
      "Predicción de ventas con IA",
      "Reportes automáticos ilimitados",
      "Alertas de metas y anomalías",
      "Hosting y tokens incluidos",
      "Setup 50% inicio / 50% entrega · mensualidad por adelantado",
    ],
    popular: false,
    deliveryTime: "1-2 semanas",
  },
  {
    id: "s8",
    icon: "Bot",
    title: "Integración IA",
    description:
      "Agrega inteligencia artificial a tu producto: chatbots, generadores de contenido, análisis predictivo con OpenAI/Claude.",
    price: "Setup $149 + $19/mes",
    category: "automatizacion",
    features: [
      "ChatGPT, Claude API y Claude Code",
      "Chatbots inteligentes",
      "Generación de contenido",
      "Análisis de sentimiento",
      "Tokens y hosting de la IA incluidos",
      "Setup 50% inicio / 50% entrega · mensualidad por adelantado",
    ],
    popular: false,
    deliveryTime: "3-7 días",
  },

  // ─── 📹 Visión IA & Dispositivos Inteligentes ───
  {
    id: "v1",
    icon: "Video",
    title: "Cámaras con Seguimiento Inteligente",
    description:
      "Le agregamos inteligencia a tus cámaras: visión por computador para seguimiento de video en tiempo real, detección de personas, vehículos y placas, con alertas al instante.",
    price: "Cotización personalizada",
    category: "vision-ia",
    features: [
      "Seguimiento inteligente de video en vivo",
      "Detección de personas, vehículos y placas",
      "Alertas en tiempo real",
      "Funciona con cámaras existentes (RTSP/IP)",
      "Cotización según número de cámaras",
    ],
    popular: true,
    deliveryTime: "1-3 semanas",
  },
  {
    id: "v2",
    icon: "Package",
    title: "Tracking de Mercancías & Contenedores",
    description:
      "Seguimiento inteligente de mercancías y contenedores: combinamos cámaras, sensores y GPS con IA para que sepas dónde está tu carga en todo momento.",
    price: "Cotización personalizada",
    category: "vision-ia",
    features: [
      "Rastreo de contenedores y mercancías",
      "Cámaras + sensores + GPS integrados",
      "Alertas de ruta, llegada y salida",
      "Historial y reportes de trazabilidad",
      "Cotización según operación",
    ],
    popular: false,
    deliveryTime: "2-4 semanas",
  },
  {
    id: "v3",
    icon: "Cpu",
    title: "Dispositivos Inteligentes a Medida",
    description:
      "Convertimos cualquier herramienta electrónica en un dispositivo inteligente mediando software e IA: básculas, sensores, máquinas, flota — si tiene datos, lo hacemos inteligente.",
    price: "Cotización personalizada",
    category: "vision-ia",
    features: [
      "Cualquier hardware + software + IA",
      "Sensores y medición en tiempo real",
      "Dashboards y alertas del dispositivo",
      "Automatización de acciones",
      "Cotización según proyecto",
    ],
    popular: false,
    deliveryTime: "2-4 semanas",
  },

  // ─── 🏗️ Desarrollo ───
  {
    id: "s1",
    icon: "Globe",
    title: "Web Apps",
    description:
      "Aplicaciones web full-stack con React, Next.js y TypeScript. SSR, SSG, ISR — la estrategia correcta para cada caso.",
    price: "Desde $299 USD",
    category: "desarrollo",
    features: [
      "Next.js / React SPA",
      "Server Side Rendering",
      "SEO optimizado",
      "Responsive design",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: true,
    deliveryTime: "1-2 semanas",
  },
  {
    id: "s2",
    icon: "Smartphone",
    title: "Mobile Apps",
    description:
      "Apps nativas y multiplataforma con React Native y Expo. Una sola base de código para iOS y Android.",
    price: "Desde $599 USD",
    category: "desarrollo",
    features: [
      "iOS + Android",
      "Expo managed workflow",
      "Push notifications",
      "Offline-first",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "2-3 semanas",
  },
  {
    id: "s3",
    icon: "Server",
    title: "APIs & Backend",
    description:
      "APIs RESTful y GraphQL con Node.js, Express, MySQL y arquitecturas serverless escalables.",
    price: "Desde $249 USD",
    category: "desarrollo",
    features: [
      "REST / GraphQL APIs",
      "MySQL / PostgreSQL",
      "Autenticación JWT/OAuth",
      "Microservicios",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "1-2 semanas",
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
    deliveryTime: "3-5 días",
  },

  // ─── 🚀 Producto ───
  {
    id: "s5",
    icon: "Rocket",
    title: "SaaS MVP",
    description:
      "Producto mínimo viable para startups. Autenticación, pagos, dashboard y deploy en tiempo récord.",
    price: "Desde $699 USD",
    category: "producto",
    features: [
      "Auth + Roles de usuario",
      "Stripe / MercadoPago",
      "Dashboard administrativo",
      "Deploy en Vercel/AWS",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: true,
    deliveryTime: "2-3 semanas",
  },
  {
    id: "s6",
    icon: "ShoppingCart",
    title: "E-commerce",
    description:
      "Tiendas online completas con carrito, pagos integrados y panel de administración de productos.",
    price: "Desde $699 USD",
    category: "producto",
    features: [
      "Stripe / MercadoPago",
      "Gestión de inventario",
      "Carrito + Checkout",
      "SEO para productos",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "2-4 semanas",
  },
  {
    id: "s7",
    icon: "BarChart3",
    title: "Dashboards & CRM",
    description:
      "Paneles administrativos y CRMs a medida con gráficos, reportes y gestión de datos en tiempo real.",
    price: "Desde $299 USD",
    category: "producto",
    features: [
      "Gráficos interactivos",
      "Exportación CSV/PDF",
      "Roles y permisos",
      "Filtros avanzados",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "1-2 semanas",
  },

  // ─── 🔧 Consultoría ───
  {
    id: "s9",
    icon: "Headset",
    title: "Mantenimiento & Soporte",
    description:
      "Paz mental para tu negocio. Hosting, backups, actualizaciones, monitoreo 24/7 y soporte técnico continuo.",
    price: "Desde $49 USD/mes",
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
    price: "Desde $99 USD",
    category: "seo",
    features: [
      "Reporte técnico + on-page + competencia",
      "Análisis de Core Web Vitals",
      "Plan de acción priorizado (PDF)",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: true,
    deliveryTime: "3-5 días",
  },
  {
    id: "seo2",
    icon: "Zap",
    title: "SEO On-Page + Velocidad",
    description:
      "Optimización de meta tags, headings, schema markup y rendimiento. Tu sitio pasará de lento a volar en los resultados de búsqueda.",
    price: "Desde $199 USD",
    category: "seo",
    features: [
      "Meta tags + headings optimizados",
      "Schema markup (JSON-LD)",
      "Lighthouse ≥ 90 garantizado",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "1 semana",
  },
  {
    id: "seo3",
    icon: "MapPin",
    title: "SEO Local (Google My Business)",
    description:
      "Perfil de negocio verificado, optimizado y conectado a tu web. Aparecé en el mapa cuando tus clientes te busquen.",
    price: "Desde $99 USD",
    category: "seo",
    features: [
      "Perfil GMB verificado y optimizado",
      "Fotos, horarios, servicios configurados",
      "Vinculación con tu sitio web",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "3-5 días",
  },
  {
    id: "seo4",
    icon: "BarChart3",
    title: "Keyword Research + Contenido",
    description:
      "Investigación de palabras clave rentables + artículos listos para publicar. Atrae tráfico que convierte.",
    price: "Desde $149 USD",
    category: "seo",
    features: [
      "30+ keywords con volumen y dificultad",
      "Análisis de intención de búsqueda",
      "2 artículos optimizados listos para publicar",
      "Pago 50% inicio / 50% entrega",
    ],
    popular: false,
    deliveryTime: "1 semana",
  },
];

export interface ServiceCategory {
  key: string;
  emoji: string;
  label: string;
  /** Nombre corto para chips de navegación. */
  shortLabel: string;
  tagline: string;
  /** Grupo de planes mensuales que se muestra al expandir esta categoría. */
  planGroup?: "redes" | "prospeccion";
}

export const serviceCategories: ServiceCategory[] = [
  {
    key: "automatizacion",
    emoji: "🤖",
    label: "Automatización & IA Empresarial",
    shortLabel: "Automatización & IA",
    planGroup: "prospeccion",
    tagline:
      "Motoriza tu empresa para vender más: agentes de IA, motores n8n prospectando nichos y procesos 100% automatizados.",
  },
  {
    key: "redes-sociales",
    emoji: "📲",
    label: "Redes Sociales Automatizadas",
    shortLabel: "Redes Sociales",
    planGroup: "redes",
    tagline:
      "Contenido que se publica solo: reels, posts e historias generados con IA y publicados en automático, con planes mensuales para empresas o particulares.",
  },
  {
    key: "vision-ia",
    emoji: "📹",
    label: "Visión IA & Dispositivos Inteligentes",
    shortLabel: "Visión IA",
    tagline:
      "Convertimos tus cámaras y dispositivos electrónicos en inteligencia: seguimiento de video, mercancías, contenedores y más — mediando software e IA.",
  },
  {
    key: "desarrollo",
    emoji: "🏗️",
    label: "Desarrollo Web & Apps",
    shortLabel: "Desarrollo & Apps",
    tagline:
      "Software a medida que hace funcionar tu negocio: aplicaciones web, móviles y APIs robustas y escalables.",
  },
  {
    key: "producto",
    emoji: "🚀",
    label: "Producto & E-commerce",
    shortLabel: "Producto & E-commerce",
    tagline:
      "Productos digitales completos: SaaS, tiendas online y paneles de gestión listos para vender.",
  },
  {
    key: "seo",
    emoji: "🔍",
    label: "SEO & Posicionamiento",
    shortLabel: "SEO",
    tagline:
      "Aparece en Google cuando tus clientes te buscan: auditoría, velocidad, SEO local y contenido que convierte.",
  },
  {
    key: "consultoria",
    emoji: "🔧",
    label: "Soporte & Mantenimiento",
    shortLabel: "Soporte",
    tagline:
      "Tu sistema siempre al día: hosting, backups, monitoreo 24/7 y soporte técnico continuo.",
  },
];

export const monthlyPlanGroups = [
  {
    key: "redes" as const,
    emoji: "📲",
    title: "Redes Sociales Automatizadas",
    subtitle:
      "Reels, publicaciones e historias con IA publicados en automático para tu empresa o marca personal.",
  },
  {
    key: "prospeccion" as const,
    emoji: "🎯",
    title: "Prospección IA · Network Marketing",
    subtitle:
      "Motores n8n que prospectan en automático los nichos recomendados para tu empresa — tú solo cierras las ventas.",
  },
];

export const defaultMonthlyPlans: MonthlyPlan[] = [
  // ── 📲 Redes Sociales Automatizadas ──
  {
    id: "redes-basico",
    group: "redes",
    name: "Básico",
    price: 200,
    tagline: "Empieza a automatizar tu contenido",
    features: [
      "12 publicaciones al mes",
      "4 reels generados con IA",
      "8 historias al mes",
      "1 red social (a elección)",
      "Calendario de contenido mensual",
      "Reporte mensual de resultados",
      "Herramientas de diseño e IA incluidas",
    ],
  },
  {
    id: "redes-normal",
    group: "redes",
    name: "Normal",
    price: 300,
    tagline: "El más elegido por negocios en crecimiento",
    popular: true,
    features: [
      "20 publicaciones al mes",
      "8 reels generados con IA",
      "12 historias al mes",
      "2 redes sociales",
      "Respuestas automáticas con IA en DMs",
      "Reporte quincenal de resultados",
      "Herramientas de diseño e IA incluidas",
    ],
  },
  {
    id: "redes-premium",
    group: "redes",
    name: "Premium",
    price: 400,
    tagline: "Tu marca activa todos los días, 100% automático",
    features: [
      "Contenido diario en todas tus redes",
      "12+ reels generados con IA",
      "Historias diarias",
      "3-4 redes sociales",
      "Community management asistido con IA",
      "Reportes semanales + reunión mensual",
      "Herramientas premium de video IA incluidas",
    ],
  },

  // ── 🎯 Prospección IA · Network Marketing ──
  {
    id: "prospeccion-basico",
    group: "prospeccion",
    name: "Básico",
    price: 250,
    tagline: "Tu primer motor de prospectación automática",
    features: [
      "1 motor n8n prospectando 24/7",
      "1 nicho recomendado por IA",
      "~200 contactos prospectados al mes",
      "1 canal (WhatsApp o email)",
      "Respuestas automáticas de primer contacto",
      "Reporte mensual de leads",
      "Infraestructura completa incluida (n8n, tokens, canales)",
    ],
  },
  {
    id: "prospeccion-normal",
    group: "prospeccion",
    name: "Normal",
    price: 450,
    tagline: "Multi-nicho con seguimiento automático",
    popular: true,
    features: [
      "2 motores n8n prospectando 24/7",
      "3 nichos recomendados por IA",
      "~500 contactos prospectados al mes",
      "2 canales (WhatsApp, email, LinkedIn o IG)",
      "Seguimiento automático de cada lead",
      "CRM incluido + reporte quincenal",
      "Infraestructura completa incluida (n8n, tokens, canales)",
    ],
  },
  {
    id: "prospeccion-premium",
    group: "prospeccion",
    name: "Premium",
    price: 650,
    tagline: "Máquina de ventas completa — tú solo cierras",
    features: [
      "4+ motores n8n prospectando 24/7",
      "Nichos ilimitados según tu rubro",
      "1,000+ contactos prospectados al mes",
      "3+ canales: WhatsApp, email, LinkedIn, Instagram",
      "Lead scoring con IA (prioriza los mejores)",
      "Agenda automática de citas + reportes semanales",
      "Infraestructura completa incluida (n8n, tokens, canales)",
      "Enriquecimiento de datos incluido",
    ],
  },
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
