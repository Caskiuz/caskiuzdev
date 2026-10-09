import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { serialize } from "@/lib/affiliate-queries";
import { MessageClient } from "./message-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const [messages, affiliates] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        affiliate: { select: { id: true, name: true } },
      },
    }),
    prisma.affiliate.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const serialized = serialize(
    messages.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      service: m.service,
      message: m.message,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
      affiliateId: m.affiliateId,
      affiliateName: m.affiliate?.name ?? null,
      attributionSource: m.attributionSource,
    }))
  );

  async function markAsRead(id: number) {
    "use server";
    await prisma.contact.update({ where: { id }, data: { read: true } });
    revalidatePath("/admin/messages");
  }

  async function markAsUnread(id: number) {
    "use server";
    await prisma.contact.update({ where: { id }, data: { read: false } });
    revalidatePath("/admin/messages");
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Mensajes de <span className="gradient-text">Contacto</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestiona los mensajes recibidos desde el formulario de contacto. Los
          leads sin afiliado se marcan en rojo: asígnalos con un clic y quedan
          al instante en «Mis leads» del afiliado.
        </p>
      </div>

      <MessageClient
        messages={serialized}
        affiliates={serialize(affiliates)}
        markAsRead={markAsRead}
        markAsUnread={markAsUnread}
      />
    </div>
  );
}
