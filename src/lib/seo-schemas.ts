/**
 * Schemas JSON-LD de "dinero" para el SEO del home:
 * - ProfessionalService + OfferCatalog con los precios reales del catálogo
 * - Review / AggregateRating desde los testimonios APROBADOS en la DB
 *   (si no hay aprobados, no se fabrica schema — Google penaliza reseñas falsas)
 */

import { defaultServices, serviceCategories } from "@/lib/services-defaults";

const BASE_URL = "https://caskiuz.vercel.app";

/** Extrae el primer número de un string de precio ("Setup $199 + $29/mes" → 199). */
function parsePrice(price: string): number | null {
  const m = /\$?\s*(\d[\d,]*)/.exec(price);
  if (!m) return null;
  return Number(m[1].replace(/,/g, ""));
}

export function serviceCatalogSchema() {
  const catalog = serviceCategories
    .map((cat) => {
      const services = defaultServices.filter((s) => s.category === cat.key);
      if (!services.length) return null;
      return {
        "@type": "OfferCatalog",
        name: cat.label,
        itemListElement: services.map((s) => ({
          "@type": "Offer",
          priceCurrency: "USD",
          ...(parsePrice(s.price) !== null ? { price: parsePrice(s.price) } : {}),
          itemOffered: {
            "@type": "Service",
            name: s.title,
            description: s.description.slice(0, 220),
          },
        })),
      };
    })
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Caskiuz — Desarrollo Web & Automatización con IA",
    url: BASE_URL,
    description:
      "Freelance full-stack: webs y apps, chatbots de WhatsApp con IA, automatización n8n, redes sociales automatizadas y SEO para negocios en Latinoamérica.",
    areaServed: ["VE", "CO", "PE", "MX", "EC", "US"],
    priceRange: "$99 - $999 USD",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de Caskiuz",
      itemListElement: catalog,
    },
  };
}

export interface ApprovedReview {
  name: string;
  role?: string | null;
  company?: string | null;
  content: string;
  rating: number;
}

/**
 * Review + AggregateRating desde testimonios aprobados.
 * null si no hay: jamás inventar reseñas.
 */
export function reviewsSchema(reviews: ApprovedReview[]) {
  if (!reviews.length) return null;
  const avg =
    reviews.reduce((acc, r) => acc + Math.max(0, Math.min(5, r.rating)), 0) / reviews.length;
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Caskiuz — Desarrollo Web & Automatización con IA",
    url: BASE_URL,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Math.round(avg * 10) / 10,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 8).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewRating: {
        "@type": "Rating",
        ratingValue: Math.max(0, Math.min(5, r.rating)),
        bestRating: 5,
      },
      reviewBody: r.content.slice(0, 500),
    })),
  };
}
