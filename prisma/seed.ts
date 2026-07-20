import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de SiteConfig...");

  // Verificar si ya existen configuraciones para NO sobrescribir datos guardados desde el panel admin
  const existingCount = await prisma.siteConfig.count();
  if (existingCount > 0) {
    console.log(`⚠️  Ya existen ${existingCount} configuraciones en la DB. Seed omitido para preservar datos del admin.`);
    console.log("   Si necesitas reiniciar los datos, vacía la tabla site_config primero.");
    return;
  }

  const configs = [
    // ─── HERO ───
    { key: "hero_name", value: "Caskiuz", group: "hero" },
    { key: "hero_title", value: "Full-Stack Developer & Software Architect", group: "hero" },
    { key: "hero_subtitle", value: "Construyo aplicaciones web y mobile de alto rendimiento que elevan tu negocio al siguiente nivel. Especializado en React, Next.js, Node.js y arquitecturas escalables en la nube.", group: "hero" },
    { key: "hero_badge", value: "Disponible para nuevos proyectos", group: "hero" },
    { key: "hero_cta_primary", value: "¡Trabajemos juntos!", group: "hero" },
    { key: "hero_cta_secondary", value: "Ver proyectos", group: "hero" },
    { key: "hero_stat_1_value", value: "3+", group: "hero" },
    { key: "hero_stat_1_label", value: "Años de experiencia", group: "hero" },
    { key: "hero_stat_2_value", value: "50+", group: "hero" },
    { key: "hero_stat_2_label", value: "Proyectos completados", group: "hero" },
    { key: "hero_stat_3_value", value: "30+", group: "hero" },
    { key: "hero_stat_3_label", value: "Clientes satisfechos", group: "hero" },

    // ─── ABOUT ───
    { key: "about_label", value: "Sobre mí", group: "about" },
    { key: "about_title", value: "Mi historia", group: "about" },
    { key: "about_bio_title", value: "Más allá del código", group: "about" },
    { key: "about_bio_p1", value: "Soy un desarrollador full-stack apasionado por crear productos digitales que marcan la diferencia. Mi enfoque combina excelencia técnica con pensamiento estratégico, asegurando que cada línea de código contribuya al éxito del negocio.", group: "about" },
    { key: "about_bio_p2", value: "Me especializo en el ecosistema React/Next.js para frontend y Node.js/MySQL para backend, con experiencia en arquitecturas serverless, microservicios y despliegues en la nube.", group: "about" },
    { key: "about_quick_location_label", value: "Ubicación", group: "about" },
    { key: "about_quick_location_value", value: "Remoto Global", group: "about" },
    { key: "about_quick_avail_label", value: "Disponible", group: "about" },
    { key: "about_quick_avail_value", value: "Full-Time", group: "about" },
    { key: "about_tl_1_year", value: "2024 — Presente", group: "about" },
    { key: "about_tl_1_title", value: "Senior Full-Stack Developer", group: "about" },
    { key: "about_tl_1_company", value: "Freelance Internacional", group: "about" },
    { key: "about_tl_1_desc", value: "Desarrollo de aplicaciones web y mobile para clientes en USA, Europa y Latinoamérica. Arquitectura de soluciones cloud-native.", group: "about" },
    { key: "about_tl_2_year", value: "2022 — 2024", group: "about" },
    { key: "about_tl_2_title", value: "Full-Stack Developer", group: "about" },
    { key: "about_tl_2_company", value: "Agencia Digital TechCo", group: "about" },
    { key: "about_tl_2_desc", value: "Lideré el equipo de frontend en proyectos React/Next.js. Implementé CI/CD pipelines y migraciones a TypeScript.", group: "about" },
    { key: "about_tl_3_year", value: "2020 — 2022", group: "about" },
    { key: "about_tl_3_title", value: "Backend Developer", group: "about" },
    { key: "about_tl_3_company", value: "Startup Fintech", group: "about" },
    { key: "about_tl_3_desc", value: "Diseñé e implementé APIs RESTful con Node.js y MySQL. Construí microservicios para procesamiento de pagos.", group: "about" },

    // ─── CONTACT ───
    { key: "contact_label", value: "Contacto", group: "contact" },
    { key: "contact_title", value: "¿Listo para empezar?", group: "contact" },
    { key: "contact_subtitle", value: "Cuéntame sobre tu proyecto y te responderé en menos de 24 horas. La primera consulta es gratis.", group: "contact" },
    { key: "contact_email", value: "rijarwow@gmail.com", group: "contact" },
    { key: "contact_whatsapp", value: "584262931869", group: "contact" },
    { key: "contact_whatsapp_message", value: "¡Hola Caskiuz! 👋 Me gustaría conversar sobre un proyecto.", group: "contact" },
    { key: "contact_linkedin_url", value: "https://www.linkedin.com/in/ricardo-agelvis-9489a9370", group: "contact" },
    { key: "contact_linkedin_label", value: "Conecta conmigo", group: "contact" },
    { key: "contact_location", value: "Remoto — Trabajo con clientes de todo el mundo", group: "contact" },
    { key: "contact_availability", value: "Lunes a Viernes, 9AM - 6PM (GMT-4)", group: "contact" },
    { key: "contact_whatsapp_card_title", value: "WhatsApp Directo", group: "contact" },
    { key: "contact_whatsapp_card_subtitle", value: "Respuesta en minutos", group: "contact" },
    { key: "contact_email_card_subtitle", value: "", group: "contact" },

    // ─── SERVICES ───
    { key: "services_label", value: "Servicios", group: "services" },
    { key: "services_title", value: "Lo que puedo hacer por ti", group: "services" },
    { key: "services_subtitle", value: "Soluciones a medida para cada etapa de tu producto digital, desde el MVP hasta la escala empresarial. Más de 9 servicios pensados para hacer crecer tu negocio.", group: "services" },
    {
      key: "services_data",
      value: JSON.stringify([
        {
          id: "s1",
          title: "Web Apps",
          description: "Aplicaciones web full-stack con React, Next.js y TypeScript. Código 100% custom, sin plantillas. Precio ajustable según alcance.",
          price: "Desde $350 USD",
          category: "desarrollo",
          features: ["Next.js / React SPA", "TypeScript + SSR/ISG", "SEO optimizado", "Pago 50% inicio / 50% entrega"],
          popular: true,
        },
        {
          id: "s2",
          title: "Mobile Apps",
          description: "Apps nativas y multiplataforma con React Native y Expo. Versión MVP desde precio base; funcionalidades extra ajustan el valor.",
          price: "Desde $800 USD",
          category: "desarrollo",
          features: ["iOS + Android (MVP)", "Expo managed workflow", "Push notifications", "Financiamiento por hitos"],
          popular: false,
        },
        {
          id: "s3",
          title: "APIs & Backend",
          description: "APIs RESTful y GraphQL con Node.js, Express, MySQL. Escala con la complejidad del proyecto.",
          price: "Desde $300 USD",
          category: "desarrollo",
          features: ["REST / GraphQL APIs", "MySQL / PostgreSQL", "Autenticación JWT/OAuth", "Arquitectura escalable"],
          popular: false,
        },
        {
          id: "s4",
          title: "Landing Pages",
          description: "Landing pages de alto rendimiento con código custom. Sin plantillas WordPress — velocidad y SEO real. El gancho perfecto para tu negocio.",
          price: "Desde $150 USD",
          category: "desarrollo",
          features: ["Next.js + TailwindCSS", "Animaciones Framer Motion", "SEO 100% optimizado", "Formulario con WhatsApp/Email"],
          popular: false,
        },
        {
          id: "s5",
          title: "SaaS MVP",
          description: "Producto mínimo viable para startups. Valida tu idea en semanas. El precio final depende de funcionalidades.",
          price: "Desde $1,000 USD",
          category: "producto",
          features: ["Auth + Roles de usuario", "Stripe / MercadoPago", "Dashboard administrativo", "Financiamiento 50/50"],
          popular: true,
        },
        {
          id: "s6",
          title: "E-commerce",
          description: "Tiendas online con carrito, pagos y panel de administración. Precio base para catálogo simple; crece con tu inventario.",
          price: "Desde $1,000 USD",
          category: "producto",
          features: ["Stripe / MercadoPago", "Gestión de inventario", "Carrito + Checkout", "Pago en 3 hitos"],
          popular: false,
        },
        {
          id: "s7",
          title: "Dashboards & CRM",
          description: "Paneles administrativos y CRMs a medida. Precio gancho para dashboards básicos; se ajusta con funcionalidades avanzadas.",
          price: "Desde $350 USD",
          category: "producto",
          features: ["Gráficos interactivos", "Exportación CSV/PDF", "Roles y permisos", "Pago 50% inicio / 50% entrega"],
          popular: false,
        },
        {
          id: "s8",
          title: "Integración IA",
          description: "Conecta tu producto a OpenAI, Claude o la IA que necesites. Chatbots, generadores de contenido, análisis. Precio de entrada inmejorable.",
          price: "Desde $150 USD",
          category: "producto",
          features: ["ChatGPT / Claude API", "Chatbots inteligentes", "Generación de contenido", "Análisis de sentimiento"],
          popular: false,
        },
        {
          id: "s9",
          title: "Mantenimiento & Soporte",
          description: "Hosting, backups, actualizaciones y una bolsa de horas mensual para cambios. Paga solo por lo que necesitas.",
          price: "Desde $80 USD/mes",
          category: "consultoria",
          features: ["Hosting + Dominio incluido", "3h de cambios/soporte al mes", "Backups automáticos", "Actualizaciones de seguridad"],
          popular: true,
        },
      ]),
      group: "services",
    },

    // ─── SOCIAL & FOOTER ───
    { key: "social_github_url", value: "https://github.com/caskiuz", group: "social" },
    { key: "social_github_label", value: "GitHub", group: "social" },
    { key: "social_linkedin_url", value: "https://www.linkedin.com/in/ricardo-agelvis-9489a9370", group: "social" },
    { key: "social_linkedin_label", value: "LinkedIn", group: "social" },
    { key: "social_twitter_url", value: "", group: "social" },
    { key: "social_twitter_label", value: "Twitter", group: "social" },
    { key: "social_youtube_url", value: "", group: "social" },
    { key: "social_youtube_label", value: "YouTube", group: "social" },
    { key: "social_instagram_url", value: "", group: "social" },
    { key: "social_instagram_label", value: "Instagram", group: "social" },
    { key: "footer_copyright", value: "© 2024 Caskiuz. Todos los derechos reservados.", group: "social" },
    { key: "footer_built_with", value: "Built with Next.js, TailwindCSS & ❤️", group: "social" },
  ];

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, group: config.group },
      create: { key: config.key, value: config.value, group: config.group },
    });
  }

  console.log(`✅ ${configs.length} configuraciones insertadas.`);
  console.log("🌱 Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });