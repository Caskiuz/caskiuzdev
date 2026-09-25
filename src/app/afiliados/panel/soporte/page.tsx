import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { SupportClient } from "@/components/affiliates/panel/support-client";

export const dynamic = "force-dynamic";

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
      <SupportClient initialTickets={initialTickets} />
    </div>
  );
}
