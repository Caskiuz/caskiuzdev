import { prisma } from "@/lib/prisma/client";
import { sendEmail, emailShell } from "@/lib/email";
import { getSaleStatusLabel } from "@/lib/affiliate-queries";

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

/**
 * Notifica al afiliado por email cuando se registra una venta a su nombre
 * o cuando cambia el estado de cobro de una venta existente.
 * Degrada silenciosamente si Resend no está configurado (solo log).
 */
export async function notifyAffiliateSale(
  saleId: number,
  event: "created" | "updated"
): Promise<void> {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { affiliate: { select: { email: true, name: true } } },
    });
    if (!sale) return;

    const statusLabel = getSaleStatusLabel(sale.status);
    const panelUrl = "https://caskiuz.vercel.app/afiliados/panel/comisiones";

    await sendEmail({
      to: sale.affiliate.email,
      subject:
        event === "created"
          ? "🛒 Nueva venta registrada — Caskiuz Affiliates"
          : "🔄 Tu venta cambió de estado — Caskiuz Affiliates",
      html: emailShell(`
        <h2 style="margin:0 0 12px;">${
          event === "created" ? "¡Nueva venta a tu nombre! 🎉" : "Actualización de tu venta"
        }</h2>
        <p>Hola ${escapeHtml(sale.affiliate.name)},</p>
        <p><strong>Servicio:</strong> ${escapeHtml(sale.serviceTitle)}</p>
        <p><strong>Monto del proyecto:</strong> $${sale.amount.toFixed(2)} USD</p>
        <p><strong>Estado de cobro:</strong> ${statusLabel}</p>
        <p><strong>Tu comisión hasta ahora:</strong> $${sale.commissionTotal.toFixed(2)} USD</p>
        <p style="font-size:13px;color:#8888a0;">Recuerda: la comisión se libera 30 días después del cobro total de la venta.</p>
        <p><a href="${panelUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver en tu panel</a></p>
      `),
    });
  } catch (error) {
    console.error("Error notificando venta al afiliado:", error);
  }
}
