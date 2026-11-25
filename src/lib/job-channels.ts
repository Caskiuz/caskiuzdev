/**
 * Dónde más enviar el CV / portafolio — curado para un full-stack de
 * Venezuela que trabaja remoto y cobra en USD.
 *
 * No son "ofertas": son canales estables donde crear perfil una vez y
 * postularse muchas veces. Los gratuitos van primero; nada aquí exige pagar.
 */

import { candidateProfile } from "@/lib/candidate-profile";

export type ChannelType = "FREELANCE" | "LATAM" | "REMOTO" | "DIRECTO";

export interface JobChannel {
  name: string;
  url: string;
  type: ChannelType;
  /** Qué tan bien encaja para este perfil (3 = prioritario) */
  priority: 1 | 2 | 3;
  note: string;
}

export const JOB_CHANNELS: JobChannel[] = [
  // ── Freelance: proyectos puntuales, cobro por entrega ──
  { name: "Workana", url: "https://www.workana.com/", type: "FREELANCE", priority: 3, note: "El marketplace freelance #1 en LatAm. Perfil en español; postula a 5-10 proyectos/día. Sin costo para postular." },
  { name: "Upwork", url: "https://www.upwork.com/", type: "FREELANCE", priority: 3, note: "El de mayor volumen global. Empieza con propuestas cortas y específicas; evita gastar connects en proyectos con 50+ postulantes." },
  { name: "Freelancer.com", url: "https://www.freelancer.com/", type: "FREELANCE", priority: 2, note: "Mucho volumen y competencia baja en español. Útil para los primeros contratos y reseñas." },
  { name: "Fiverr", url: "https://www.fiverr.com/", type: "FREELANCE", priority: 2, note: "Publica 3 gigs empaquetados: landing Next.js, chatbot WhatsApp, automatización n8n. Precio de entrada y extras." },
  { name: "PeoplePerHour", url: "https://www.peopleperhour.com/", type: "FREELANCE", priority: 1, note: "Reino Unido/Europa; menos competencia que Upwork y presupuestos en GBP/EUR." },
  { name: "Guru", url: "https://www.guru.com/", type: "FREELANCE", priority: 1, note: "Marketplace clásico con clientes de EE. UU.; perfil técnico y portafolio." },
  { name: "Contra", url: "https://contra.com/", type: "FREELANCE", priority: 2, note: "Comisiones 0% para el freelancer; perfil visual con proyectos. Bueno para clientes directos." },
  { name: "Braintrust", url: "https://www.usebraintrust.com/", type: "FREELANCE", priority: 2, note: "Red con tarifas altas; el freelancer no paga comisión. Aplica a roles de producto/IA." },
  { name: "Toptal", url: "https://www.toptal.com/", type: "FREELANCE", priority: 2, note: "Proceso de selección exigente pero tarifas premium. Vale la pena intentarlo con el portafolio pulido." },
  { name: "Arc.dev", url: "https://arc.dev/", type: "FREELANCE", priority: 2, note: "Solo remoto, clientes de EE. UU.; entrevista técnica y matching con empresas." },
  { name: "Gun.io", url: "https://gun.io/", type: "FREELANCE", priority: 1, note: "Freelancers senior de EE. UU.; tarifas altas y proyectos de 3-6 meses." },
  { name: "Lemon.io", url: "https://lemon.io/", type: "FREELANCE", priority: 2, note: "Coloca developers de LatAm/Europa del Este en startups; proceso rápido y pagos en USD." },
  { name: "Turing", url: "https://www.turing.com/", type: "FREELANCE", priority: 2, note: "Matching con empresas de EE. UU. para roles full-stack; pruebas técnicas pagadas." },
  { name: "Crossover", url: "https://www.crossover.com/", type: "FREELANCE", priority: 1, note: "Roles full-time remotos con pruebas exigentes; salarios en USD publicados." },
  { name: "Ureed", url: "https://www.ureed.com/", type: "FREELANCE", priority: 1, note: "Proyectos en español/árabe; útil para contenido técnico y desarrollo web." },

  // ── Bolsas LatAm ──
  { name: "GetOnBoard", url: "https://www.getonbrd.com/", type: "LATAM", priority: 3, note: "Bolsas tech de LatAm (Chile/Colombia/México). Perfil en español y postulación directa." },
  { name: "Torre", url: "https://torre.ai/", type: "LATAM", priority: 3, note: "Tu perfil ya está creado. Completa proyectos y verificación para aparecer en más búsquedas." },
  { name: "Computrabajo", url: "https://www.computrabajo.com/", type: "LATAM", priority: 2, note: "El portal masivo de LatAm; filtra por 'remoto' y 'desarrollador'. CV en español." },
  { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/", type: "LATAM", priority: 3, note: "Activa 'Open to work' y alertas para full-stack remoto. Postula con el CV en PDF y mensaje al reclutador." },
  { name: "Wellfound", url: "https://wellfound.com/jobs", type: "LATAM", priority: 2, note: "Startups (antes AngelList). Muchas aceptan LatAm y pagan en USD." },
  { name: "Y Combinator — Work at a Startup", url: "https://www.workatastartup.com/", type: "LATAM", priority: 2, note: "Crea perfil una vez y las startups de YC te contactan. Muy buen filtro de calidad." },
  { name: "Mercado Libre Careers", url: "https://www.mercadolibre.com/careers", type: "LATAM", priority: 2, note: "Remoto en LatAm, procesos formales y beneficios. Busca 'Developer' + país." },
  { name: "Globant Careers", url: "https://www.globant.com/careers", type: "LATAM", priority: 1, note: "Consultora grande con proyectos remotos; suele contratar en Venezuela/Colombia." },
  { name: "Encora Careers", url: "https://www.encora.com/careers", type: "LATAM", priority: 1, note: "Nearshore para EE. UU.; inglés intermedio y stack JS/Python." },
  { name: "Nearsure", url: "https://nearsure.com/careers/", type: "LATAM", priority: 2, note: "Nearshore LatAm→EE. UU., 100% remoto y en USD. Proceso en inglés." },

  // ── Bolsas remotas globales ──
  { name: "Remotive", url: "https://remotive.com/", type: "REMOTO", priority: 2, note: "Ya entra a tu hub automáticamente; crea perfil para que las empresas te encuentren." },
  { name: "Remote OK", url: "https://remoteok.com/", type: "REMOTO", priority: 2, note: "Igual: fuente del hub. Publica tu perfil y revisa la sección 'hire remote'." },
  { name: "We Work Remotely", url: "https://weworkremotely.com/", type: "REMOTO", priority: 2, note: "Bolsas curadas; muchas empresas aceptan LatAm. Suscripción por email gratis." },
  { name: "Himalayas", url: "https://himalayas.app/jobs", type: "REMOTO", priority: 1, note: "Remoto global con filtros por zona horaria; perfil gratuito." },
  { name: "Jobicy", url: "https://jobicy.com/", type: "REMOTO", priority: 1, note: "Filtra por LatAm; ya alimenta tu hub." },
  { name: "Working Nomads", url: "https://www.workingnomads.com/jobs", type: "REMOTO", priority: 1, note: "Curado para nómadas digitales; suscripción diaria gratis." },
  { name: "HN Who is Hiring", url: "https://news.ycombinator.com/user?id=whoishiring", type: "REMOTO", priority: 3, note: "Hilo mensual con cientos de empresas. Responde al comentario o al email del post; ya entra al hub." },
  { name: "HN Freelance", url: "https://news.ycombinator.com/user?id=whoishiring", type: "REMOTO", priority: 2, note: "Hilo 'SEEKING FREELANCER' del mismo usuario. Proyectos puntuales bien pagados." },
  { name: "Deel Jobs", url: "https://jobs.deel.com/", type: "REMOTO", priority: 2, note: "Empresas que ya contratan global vía Deel; filtro por LatAm y rol." },
  { name: "Glassdoor", url: "https://www.glassdoor.com/Job/index.htm", type: "REMOTO", priority: 1, note: "Investigación de salarios + vacantes; útil para negociar tarifas." },
  { name: "Indeed", url: "https://www.indeed.com/", type: "REMOTO", priority: 1, note: "Busca 'remote developer' y 'LatAm'; sube el CV en PDF una vez." },

  // ── Empresas 100% remotas (postulación directa) ──
  { name: "Deel Careers", url: "https://www.deel.com/careers/", type: "DIRECTO", priority: 2, note: "Empresa remota global con roles de ingeniería; inglés profesional." },
  { name: "Remote Careers", url: "https://remote.com/careers", type: "DIRECTO", priority: 2, note: "Remote (la empresa) contrata en LatAm; cultura async y en USD." },
  { name: "GitLab Careers", url: "https://about.gitlab.com/jobs/", type: "DIRECTO", priority: 2, note: "All-remote de verdad y proceso público. Busca 'Fullstack Engineer'." },
  { name: "Automattic", url: "https://automattic.com/work-with-us/", type: "DIRECTO", priority: 2, note: "WordPress.com/Tumblr; 100% distribuida y contrata en LatAm." },
  { name: "Zapier Careers", url: "https://zapier.com/jobs", type: "DIRECTO", priority: 2, note: "Remota global; encaja con tu perfil de automatización e IA." },
  { name: "Buffer", url: "https://buffer.com/journey", type: "DIRECTO", priority: 1, note: "Remota desde siempre; salarios transparentes y procesos lentos pero humanos." },
  { name: "Doist", url: "https://doist.com/careers", type: "DIRECTO", priority: 1, note: "Todoist/Twist; remota global con equipos pequeños y seniority alta." },
  { name: "Vercel Careers", url: "https://vercel.com/careers", type: "DIRECTO", priority: 3, note: "Tu stack principal (Next.js). Muestra caskiuz.vercel.app como carta de presentación." },
  { name: "Supabase Careers", url: "https://supabase.com/careers", type: "DIRECTO", priority: 2, note: "Remota global, open source y stack JS/Postgres; muy afín." },
  { name: "Shopify Careers", url: "https://www.shopify.com/careers", type: "DIRECTO", priority: 1, note: "Digital-by-design; roles remotos en LatAm y mucho e-commerce." },
  { name: "EPAM Careers", url: "https://www.epam.com/careers", type: "DIRECTO", priority: 1, note: "Consultora global con oficinas en LatAm; procesos formales y en inglés." },
  { name: "Thoughtworks Careers", url: "https://www.thoughtworks.com/careers", type: "DIRECTO", priority: 1, note: "Consultoría técnica; contrata en LatAm y valora portafolio real." },
];

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  FREELANCE: "Freelance / proyectos",
  LATAM: "LatAm / español",
  REMOTO: "Bolsas remotas",
  DIRECTO: "Empresas remotas",
};

/** Pitch listo para pegar en formularios que piden "presentación" o "bio". */
export function buildPitch(lang: "es" | "en" = "es"): string {
  const p = candidateProfile;
  if (lang === "en") {
    return `Hi! I'm Ricardo Agelvis (Caskiuz), a Full-Stack Developer & AI Automation Engineer with 6+ years of experience building end-to-end products. I specialize in the JavaScript/TypeScript ecosystem (React, Next.js, Node.js) and Python (Django, FastAPI), plus AI automation: WhatsApp chatbots, n8n workflows and Gemini-powered agents.

Recent work includes Caskiuz (my freelance studio), a predictive analytics platform for fintech (Python/React) and business process automation for enterprise clients. I'm available for remote work from Venezuela (UTC-4), fluent in Spanish and professional in English.

Portfolio: ${p.links.portfolio} · CV: ${p.links.cv} · GitHub: ${p.links.github} · LinkedIn: ${p.links.linkedin}`;
  }
  return `Hola, soy Ricardo Agelvis (Caskiuz), Desarrollador Full-Stack e Ingeniero de Automatización con IA, con 6+ años construyendo productos de extremo a extremo. Domino el ecosistema JavaScript/TypeScript (React, Next.js, Node.js) y Python (Django, FastAPI), además de automatización con IA: chatbots de WhatsApp, workflows n8n y agentes con Gemini.

He trabajado en Caskiuz (mi estudio freelance), una plataforma de análisis predictivo para fintech (Python/React) y automatización de procesos para clientes empresariales. Estoy disponible para trabajo remoto desde Venezuela (UTC-4), español nativo e inglés profesional.

Portafolio: ${p.links.portfolio} · CV: ${p.links.cv} · GitHub: ${p.links.github} · LinkedIn: ${p.links.linkedin}`;
}
