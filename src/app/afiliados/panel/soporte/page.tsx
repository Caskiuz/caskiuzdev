import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { SupportClient } from "@/components/affiliates/panel/support-client";
import Link from "next/link";
import { AFFILIATE_FAQS } from "@/lib/affiliate-content";
import { BookOpen, LifeBuoy } from "lucide-react";

export const dynamic = "force-dynamic";

// Las dudas más comunes, para resolverlas antes de abrir un ticket
const SELF_HELP_FAQS = [
  AFFILIATE_FAQS[8], // ¿Cómo promociono los servicios?
  AFFILIATE_FAQS[4], // ¿Cómo sé que una venta es mía?
  AFFILIATE_FAQS[2], // ¿Cuándo puedo retirar mis comisiones?
  AFFILIATE_FAQS[7], // ¿Necesito factura o documentos para cobrar?
  AFFILIATE_FAQS[3], // ¿En qué monedas me pagan?
  AFFILIATE_FAQS[1], // ¿Cómo se calcula mi comisión?
];

export default async function SupportPage() {
  const affiliate = await requireAffiliate();

  const tickets = await prisma.supportTicket.findMany({
    where: { affiliateId: affiliate.id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const initialTickets = serialize(
    tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      replies: t.replies.map((r) => ({
        id: r.id,
        author: r.author,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
      })),
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Soporte</h1>
        <p className="text-muted-foreground mt-1">Asistencia técnica y dudas sobre el programa.</p>
      </div>

      <div className="metal-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-aff-blue/10 border border-aff-blue/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-aff-cyan" />
          </div>
          <div>
            <h2 className="font-bold">Antes de escribirnos, mira si tu duda es una de estas</h2>
            <p className="text-xs text-muted-foreground">
              La mayoría de las preguntas ya tienen respuesta aquí.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {SELF_HELP_FAQS.map((faq) => (
            <details key={faq.q} className="rounded-xl bg-surface-hover border border-border group">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-4 text-sm font-semibold">
                {faq.q}
                <span className="text-aff-cyan shrink-0 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <LifeBuoy className="w-4 h-4 text-aff-cyan" /> ¿Nada de esto responde tu duda? Abre un ticket aquí abajo.
          </p>
          <Link
            href="/afiliados/panel/ayuda"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-aff-blue/15 text-aff-cyan border border-aff-blue/20 hover:bg-aff-blue/25 transition-colors"
          >
            Ver todas las guías →
          </Link>
        </div>
      </div>

      <SupportClient initialTickets={initialTickets} />
    </div>
  );
}
