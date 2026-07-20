import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { MessageClient } from "./message-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });

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
          Gestiona los mensajes recibidos desde el formulario de contacto.
        </p>
      </div>

      <MessageClient
        messages={JSON.parse(JSON.stringify(messages))}
        markAsRead={markAsRead}
        markAsUnread={markAsUnread}
      />
    </div>
  );
}