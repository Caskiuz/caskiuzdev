import Link from "next/link";
import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { Users, ShoppingCart, ArrowRight, UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

const SERVICE_LABELS: Record<string, string> = {
  web: "Desarrollo Web",
  mobile: "Desarrollo Mobile",
  api: "API / Backend",
  consulting: "Consultoría",
  other: "Otro",
};

export default async function LeadsPage() {
  const affiliate = await requireAffiliate();

  const [contacts, sales] = await Promise.all([
    prisma.contact.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.sale.findMany({
      where: { affiliateId: affiliate.id },
      select: { contactId: true, status: true },
    }),
  ]);

  const saleByContact = new Map(
    sales.filter((s) => s.contactId).map((s) => [s.contactId as number, s.status])
  );

  const leads = serialize(
    contacts.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      service: c.service,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
      saleStatus: saleByContact.get(c.id) ?? null,
    }))
  );

  const converted = leads.filter(
    (l) => l.saleStatus && l.saleStatus !== "LEAD" && l.saleStatus !== "REFUNDED"
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-aff-cyan" /> Mis leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Las personas que llegaron por tu link: {leads.length} en total · {converted}{" "}
            convertidas a venta.
          </p>
        </div>
        <Link href="/afiliados/panel/enlaces" className="btn-aff metal-shine px-5 py-2.5 text-sm">
          <ArrowRight className="w-4 h-4" /> Obtener más leads
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="metal-card rounded-2xl p-10 text-center">
          <UserPlus className="w-12 h-12 text-aff-cyan/50 mx-auto mb-4" />
          <p className="font-semibold mb-2">Aún no tienes leads</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Cada persona que haga clic en tu link y se contacte por el formulario o con tu
            código de referido aparecerá aquí automáticamente.
          </p>
          <Link href="/afiliados/panel/enlaces" className="btn-aff metal-shine px-6 py-3 text-sm inline-flex">
            Copiar mi link
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const isRegistered = lead.saleStatus === "LEAD";
            const isConverted =
              lead.saleStatus && lead.saleStatus !== "LEAD" && lead.saleStatus !== "REFUNDED";
            return (
              <div key={lead.id} className="metal-card rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold flex items-center gap-2 flex-wrap">
                      {lead.name}
                      {isConverted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-500/10 text-green-500">
                          <ShoppingCart className="w-3 h-3" /> Convertido a venta
                        </span>
                      )}
                      {isRegistered && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-aff-blue/10 text-aff-cyan">
                          <ShoppingCart className="w-3 h-3" /> Venta registrada
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.email}
                      {lead.service
                        ? ` · ${SERVICE_LABELS[lead.service] ?? lead.service}`
                        : " · Sin servicio indicado"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      “{lead.message}”
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(lead.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed">
        💡 <strong className="text-foreground">¿Cómo se convierte un lead en venta?</strong>{" "}
        Cuando la persona contrata, el equipo de Caskiuz registra la venta a tu nombre y la
        ves en{" "}
        <Link href="/afiliados/panel/comisiones" className="text-aff-cyan hover:underline">
          Comisiones
        </Link>{" "}
        con su estado de cobro. Además recibes un correo con cada novedad.
      </div>
    </div>
  );
}
