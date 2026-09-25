import { prisma } from "@/lib/prisma/client";
import { releaseMaturedCommissions } from "@/lib/commissions";
import { serialize } from "@/lib/affiliate-queries";
import { SalesManager } from "@/components/admin/sales-manager";
import { ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage() {
  await releaseMaturedCommissions();

  const [sales, contacts, affiliates] = await Promise.all([
    prisma.sale.findMany({
      include: {
        affiliate: { select: { id: true, name: true, email: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.contact.findMany({
      where: { affiliateId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.affiliate.findMany({
      where: { status: { not: "SUSPENDED" } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" /> Ventas de afiliados
        </h1>
        <p className="text-muted-foreground mt-1">
          Registra ventas y su estado de cobro. Las comisiones se calculan y actualizan solas.
        </p>
      </div>

      <SalesManager
        sales={serialize(
          sales.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))
        )}
        contacts={serialize(
          contacts.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            service: c.service,
            affiliateId: c.affiliateId,
          }))
        )}
        affiliates={serialize(affiliates)}
      />
    </div>
  );
}
