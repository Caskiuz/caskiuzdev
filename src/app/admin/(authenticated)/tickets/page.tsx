import { Headphones } from "lucide-react";
import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { TicketsManager } from "@/components/admin/tickets-manager";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    include: {
      affiliate: { select: { id: true, name: true, email: true } },
      replies: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  const initialTickets = serialize(
    tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      affiliate: t.affiliate,
      replies: t.replies.map((r) => ({
        id: r.id,
        author: r.author,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
      })),
    }))
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Headphones className="w-6 h-6 text-primary" /> Tickets de soporte
        </h1>
        <p className="text-muted-foreground mt-1">
          Responde las dudas y problemas de los afiliados.
        </p>
      </div>
      <TicketsManager initialTickets={initialTickets} />
    </div>
  );
}
