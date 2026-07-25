import { prisma } from "@/lib/prisma/client";
import { TestimonialsClient } from "./testimonials-client";

export const dynamic = "force-dynamic";

export default async function TestimonialsSettingsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <TestimonialsClient initialTestimonials={JSON.parse(JSON.stringify(testimonials))} />;
}