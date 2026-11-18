/**
 * Recomendaciones de afiliados EXTERNOS (hosting, dominios, herramientas):
 * monetización pasiva del blog — desde el primer visitante.
 *
 * ⚠️ ANTES DE PUBLICAR: reemplaza cada `url` por TU link de afiliado real.
 * Regístrate gratis en cada programa (sin costo) y pega tu link aquí.
 * Mientras el link sea el genérico, no generas comisión pero tampoco engañas
 * a nadie: el disclosure siempre se muestra junto a los links (obligatorio).
 *
 * Programas sugeridos (todos gratis de unir):
 * - Hostinger:     https://www.hostinger.es/afiliados  (~60-70% por venta)
 * - Namecheap:     https://www.namecheap.com/affiliates/ (~30% dominios)
 * - DigitalOcean:  https://www.digitalocean.com/referral-program ($25 por referido con gasto)
 * - Canva:         https://www.canva.com/pro-affiliates/ (programa vía impact)
 */

export interface RecommendedTool {
  name: string;
  emoji: string;
  /** Qué es y para quién — texto honesto de una frase. */
  pitch: string;
  /** Por qué lo recomendamos (honestidad = conversión). */
  why: string;
  /** TODO: reemplazar por tu link de afiliado cuando te registres en el programa. */
  url: string;
  price: string;
}

export const recommendedTools: RecommendedTool[] = [
  {
    name: "Hostinger",
    emoji: "🚀",
    pitch: "Hosting rápido y barato para lanzar tu web hoy mismo.",
    why: "Es el hosting que recomiendo a clientes que arrancan solos: panel simple, dominio gratis el primer año y soporte en español. Planes desde ~$2.99/mes.",
    url: "https://hostinger.es?REFERRALCODE=TU_CODIGO_AQUI",
    price: "desde $2.99/mes",
  },
  {
    name: "Namecheap",
    emoji: "🌐",
    pitch: "Dominios baratos sin subidas de precio en la renovación.",
    why: "Renovar dominios aquí cuesta lo mismo que comprarlos — evita la trampa del 'primer año gratis, renovación x4'. Ideal para proteger tu marca.",
    url: "https://www.namecheap.com/?aff=TU_CODIGO_AQUI",
    price: "dominios desde ~$6/año",
  },
  {
    name: "DigitalOcean",
    emoji: "🌊",
    pitch: "Servidores VPS para montar tu propio n8n y automatizar sin límites.",
    why: "Un droplet de $6/mes corre tu n8n con miles de tareas gratis — es exactamente el setup que uso para los motores de prospección. $200 de crédito para probar.",
    url: "https://m.do.co/c/TU_CODIGO_AQUI",
    price: "VPS desde $6/mes",
  },
  {
    name: "Canva Pro",
    emoji: "🎨",
    pitch: "Diseño de publicaciones y materiales de marketing sin ser diseñador.",
    why: "Para clientes que gestionan sus redes entre entrega y entrega: plantillas profesionales y remoción de fondo en un clic.",
    url: "https://www.canva.com/pro/?referrer=TU_CODIGO_AQUI",
    price: "Plan Pro mensual",
  },
];

/** Disclosure legal visible junto a cualquier enlace de afiliado. */
export const AFFILIATE_DISCLOSURE =
  "Divulgación de afiliados: algunos de los enlaces de esta sección son enlaces de afiliados. Si compras a través de ellos, puedo recibir una comisión sin costo adicional para ti. Solo recomiendo herramientas que uso o reviso personalmente.";
