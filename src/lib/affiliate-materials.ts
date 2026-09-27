/**
 * Copy de los materiales promocionales del panel de afiliados.
 * Sin precios: el mensaje genera el interés, Caskiuz cierra la venta.
 * "[TU LINK]" se reemplaza por el link único del afiliado al copiar.
 */

export interface PromoMaterial {
  id: string;
  variant: string;
  text: string;
}

export interface MaterialSection {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  note?: string;
  materials: PromoMaterial[];
}

export const MATERIAL_SECTIONS: MaterialSection[] = [
  {
    id: "whatsapp",
    icon: "whatsapp",
    title: "WhatsApp",
    subtitle: "Para enviar directo por chat o compartir en tu estado.",
    materials: [
      {
        id: "wa-directa",
        variant: "Venta directa",
        text: "🚀 ¿Sabes cuántos clientes pierdes cada día por no tener página web?\n\nMientras tu negocio no aparece en internet, tus clientes te buscan… y se van con quien aparece primero.\n\nYo trabajo con Caskiuz: webs, tiendas online y apps pensadas para captar clientes por ti, todos los días.\n\n👉 Cotiza gratis y sin compromiso aquí:\n[TU LINK]",
      },
      {
        id: "wa-automatizacion",
        variant: "Automatización",
        text: "🤖 Imagina tu negocio vendiendo mientras duermes.\n\nUna web profesional trabaja por ti 24/7: muestra tus servicios, responde las dudas frecuentes y recibe pedidos a cualquier hora.\n\nEso es lo que Caskiuz construye: web, tienda online o app para que tu negocio no dependa de que tú estés disponible.\n\nTe dejo el enlace con toda la info 👇\n[TU LINK]",
      },
      {
        id: "wa-confianza",
        variant: "Confianza",
        text: "Hace un tiempo entendí algo que me cambió la forma de ver los negocios: el que no tiene presencia web profesional, regala sus clientes a la competencia. 😅\n\nPor eso recomiendo a Caskiuz: seriedad, calidad y acompañamiento en todo el proyecto, de principio a fin.\n\nSi tu negocio necesita web, tienda online o una app, empieza con una cotización gratis y sin compromiso 👇\n[TU LINK]",
      },
    ],
  },
  {
    id: "instagram",
    icon: "instagram",
    title: "Instagram / Facebook",
    subtitle: "Para feed, historias o estados.",
    materials: [
      {
        id: "ig-automatizacion",
        variant: "Automatización",
        text: "Tu negocio no descansa… y no debería depender de que tú respondas. 💼\n\nUna web profesional vende por ti 24/7: capta clientes, muestra tu trabajo y recibe consultas mientras tú duermes.\n\nCon Caskiuz lo tienes todo: web, tienda online, apps y SEO.\n\nLink en mi bio 👆\n#emprendimiento #negociosdigitales #desarrolloweb",
      },
      {
        id: "ig-perdida",
        variant: "Pérdida de clientes",
        text: "Cada día sin presencia web = clientes que eligen a tu competencia. 📉\n\nNo es suerte: es estar donde tus clientes te buscan.\n\nCaskiuz crea webs y tiendas online profesionales, rápidas y pensadas para vender.\n\n👉 Cotiza gratis: link en mi bio.\n#marketingdigital #negociosonline",
      },
      {
        id: "ig-educativo",
        variant: "Educativo",
        text: "3 cosas que toda web profesional debe tener (y Caskiuz las incluye todas): ✅\n\n1️⃣ Carga rápida: si tarda más de 3 segundos, pierdes visitas.\n2️⃣ Botón de contacto directo: cada visita debe poder escribirte en un clic.\n3️⃣ Diseño que genera confianza: tu web es tu primera impresión.\n\n¿Tu negocio ya las tiene? Cotiza gratis: link en bio 👆",
      },
    ],
  },
  {
    id: "twitter",
    icon: "twitter",
    title: "Twitter / X",
    subtitle: "Posts cortos y threads.",
    materials: [
      {
        id: "tw-directa",
        variant: "Venta directa",
        text: "Si tienes un negocio y no tienes web, no estás perdiendo visitas: estás regalando clientes a tu competencia. 🧵\n\nCaskiuz construye webs, tiendas online y apps pensadas para vender, no solo para verse bien.\n\nCotización gratis y sin compromiso 👇\n[TU LINK]",
      },
      {
        id: "tw-consultiva",
        variant: "Consultiva",
        text: "El 75% de las personas juzga la credibilidad de un negocio por su página web… antes siquiera de escribirte.\n\nTu web es tu vendedor 24/7. Haz que venda por ti 👇\n[TU LINK]",
      },
    ],
  },
  {
    id: "video",
    icon: "video",
    title: "YouTube / TikTok (guion)",
    subtitle: "Para grabar un video corto o un reel.",
    materials: [
      {
        id: "yt-guion",
        variant: "Guion",
        text: "🎬 Hook: «Tu negocio pierde ventas todos los días… mientras duerme.»\n\nCuerpo: muestra 3 ejemplos de lo que Caskiuz construye (web profesional, tienda online, SEO) y lo que cada uno hace por tu negocio: captar clientes, vender 24/7 y aparecer en Google.\n\nCTA: «Empieza con una cotización gratis. Link en la descripción 👇»",
      },
    ],
  },
  {
    id: "email",
    icon: "email",
    title: "Email frío",
    subtitle: "Para prospectos con los que aún no has hablado.",
    note: "💡 Reemplaza [Nombre] y [Negocio] antes de enviar.",
    materials: [
      {
        id: "email-valor",
        variant: "Valor",
        text: "Hola [Nombre],\n\nVi el trabajo de [Negocio] y noté algo: un negocio como el tuyo podría estar captando clientes todos los días, incluso fuera de tu horario.\n\nTrabajo con Caskiuz, un desarrollador que crea webs, tiendas online y apps diseñadas para que tu negocio venda 24/7, no solo para verse bien.\n\n¿Qué te parece una cotización gratis y sin compromiso?\n\n👉 [TU LINK]\n\nUn saludo,\n[Tu nombre]",
      },
      {
        id: "email-dolor",
        variant: "Dolor",
        text: "Hola [Nombre],\n\nTe escribo porque la mayoría de tus clientes potenciales te busca en internet antes de decidir… y si no te encuentra, elige a otro.\n\nUna web profesional no es un gasto: es tu vendedor que trabaja 24/7 y nunca pide vacaciones.\n\nCon Caskiuz tienes web, tienda online o app con calidad garantizada y acompañamiento en todo el proceso.\n\n¿Quieres ver qué se puede hacer por [Negocio]? Cotiza gratis aquí 👉 [TU LINK]\n\nUn saludo,\n[Tu nombre]",
      },
    ],
  },
  {
    id: "dm",
    icon: "dm",
    title: "Mensajes directos (DM)",
    subtitle:
      "Para contactar negocios por Instagram, Facebook o WhatsApp sin presentación previa.",
    note: "💡 Personaliza el mensaje con el nombre del negocio antes de enviar.",
    materials: [
      {
        id: "dm-directo",
        variant: "Directo",
        text: "¡Hola! 👋 Vi tu perfil y tu negocio se ve buenísimo.\n\n¿Sabías que podrías estar captando clientes 24/7 con una página web profesional?\n\nTe dejo la info de Caskiuz, por si quieres dar el salto:\n[TU LINK]",
      },
      {
        id: "dm-suave",
        variant: "Suave",
        text: "¡Hola! 👋 Te escribo porque tu negocio tiene mucho potencial y una web profesional podría multiplicarlo.\n\nCaskiuz crea webs y tiendas online pensadas para vender, no solo para verse bien.\n\nSi te interesa, la cotización es gratis y sin compromiso 👇\n[TU LINK]",
      },
      {
        id: "dm-pregunta",
        variant: "Pregunta abridora",
        text: "¡Hola! 👋 Una pregunta rápida: ¿cómo llegan hoy tus clientes a tu negocio? 🤔\n\nSi la respuesta no es «por internet», estás dejando ventas sobre la mesa.\n\nTe explico cómo Caskiuz puede ayudarte:\n[TU LINK]",
      },
    ],
  },
  {
    id: "seguimiento",
    icon: "followup",
    title: "Secuencia de seguimiento",
    subtitle:
      "Qué enviar si el prospecto no responde. Envía un mensaje a la vez y espera su respuesta.",
    note: "💡 Reemplaza [Nombre] con el nombre del prospecto.",
    materials: [
      {
        id: "seq-dia0",
        variant: "Día 0 · Presentación",
        text: "¡Hola [Nombre]! 👋 Te escribo porque creo que a tu negocio le vendría genial una presencia web profesional que trabaje por ti 24/7.\n\nCaskiuz crea webs, tiendas online y apps pensadas para vender.\n\nTe dejo el enlace para que veas lo que hacen 👇\n[TU LINK]",
      },
      {
        id: "seq-dia2",
        variant: "Día 2 · Recordatorio",
        text: "¡Hola [Nombre]! ¿Alcanzaste a ver el enlace que te dejé? 👀\n\nMientras tanto te comparto algo útil: 3 cosas que toda web profesional debe tener ✅\n\n1️⃣ Carga rápida\n2️⃣ Botón de contacto directo\n3️⃣ Diseño que genera confianza\n\n¿Cuál crees que le falta a tu negocio? 🤔",
      },
      {
        id: "seq-dia7",
        variant: "Día 7 · Cierre suave",
        text: "¡Hola [Nombre]! 😅 No quiero insistir, solo recordarte que la cotización con Caskiuz es gratis y sin compromiso.\n\nCuando quieras dar el salto, aquí estoy 👇\n[TU LINK]",
      },
    ],
  },
];

export interface Objection {
  id: string;
  objection: string;
  response: string;
}

export const OBJECTIONS: Objection[] = [
  {
    id: "obj-precio",
    objection: "¿Cuánto cuesta?",
    response:
      "Buena pregunta. El precio depende de lo que tu negocio necesite: web simple, tienda online, SEO, app…\n\nPor eso la cotización es gratis y a medida: así sabes exactamente qué incluye y qué te conviene.\n\nPídela sin compromiso aquí 👇\n[TU LINK]",
  },
  {
    id: "obj-tiempo",
    objection: "No tengo tiempo",
    response:
      "¡Justo por eso! 😄 La idea es que tu web trabaje por ti y te ahorre tiempo respondiendo las mismas preguntas todos los días.\n\nEl proceso es sencillo y te acompañan en todo: tú sigues con tu negocio.\n\nCotiza gratis cuando quieras: [TU LINK]",
  },
  {
    id: "obj-ya-tengo",
    objection: "Ya tengo página",
    response:
      "¡Perfecto! Entonces ya sabes lo importante que es. 💪\n\n¿Cuántos clientes te trae cada mes? Si la respuesta no te convence, vale la pena una revisión gratuita para ver qué se puede mejorar.\n\nPídela aquí, sin compromiso: [TU LINK]",
  },
  {
    id: "obj-no-interesa",
    objection: "No me interesa",
    response:
      "Sin problema, cero compromiso. 🙌\n\nSolo te dejo el enlace por si más adelante cambias de opinión:\n[TU LINK]",
  },
];

export const PROMO_BANNER = `<a href="[TU LINK]" style="display:inline-block;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#1e3a8a,#0ea5e9);color:#fff;font-weight:700;font-family:sans-serif;text-decoration:none;">
  🚀 ¿Listo para que tu negocio venda 24/7? Cotiza gratis
</a>`;

export const PROMO_TIPS: string[] = [
  "Publica en horarios de mayor actividad de tu audiencia (mañana 8-10am o noche 7-9pm).",
  "Personaliza cada mensaje: usar el nombre del negocio o del prospecto en DMs y emails multiplica las respuestas.",
  "Usa un sub-ID distinto por red social para medir qué canal te da más ventas.",
  "El 80% del resultado está en la constancia: publica al menos 3 veces por semana.",
  "Muestra resultados, no precios: comparte testimonios y casos de éxito reales de la página principal.",
  "Responde rápido a quien pregunte: los primeros minutos después de un mensaje marcan la diferencia.",
  "Sigue la secuencia: presentación → recordatorio a las 48h → cierre suave a los 7 días. La mayoría de las ventas salen del segundo mensaje.",
  "Interactúa con páginas de negocios locales (comenta, da like): es la forma más real de que te conozcan.",
];
