import { prisma } from "@/lib/prisma/client";
import { sendEmail, emailShell, isEmailConfigured } from "@/lib/email";
import { getSaleStatusLabel } from "@/lib/affiliate-queries";

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

/** Tope de correos por anuncio (protege la cuota gratuita de Brevo: 300/día). */
export const ANNOUNCEMENT_EMAIL_LIMIT = 200;

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
        <p style="font-size:13px;color:#8888a0;">Tu comisión ya quedó disponible: puedes retirarla desde $30 USD.</p>
        <p><a href="${panelUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver en tu panel</a></p>
      `),
    });
  } catch (error) {
    console.error("Error notificando venta al afiliado:", error);
  }
}

/**
 * Envía un anuncio global por correo a todos los afiliados activos.
 * Devuelve cuántos se enviaron y si hay proveedor de correo configurado.
 * Degrada en silencio si no hay proveedor (el anuncio igual queda en el panel).
 */
export async function notifyAffiliatesAnnouncement(announcement: {
  title: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
}): Promise<{ sent: number; total: number; emailConfigured: boolean }> {
  const emailConfigured = isEmailConfigured();
  if (!emailConfigured) return { sent: 0, total: 0, emailConfigured };

  const affiliates = await prisma.affiliate.findMany({
    where: { status: { not: "SUSPENDED" } },
    select: { email: true, name: true },
    orderBy: { id: "asc" },
    take: ANNOUNCEMENT_EMAIL_LIMIT,
  });

  const panelUrl = "https://caskiuz.vercel.app/afiliados/panel/anuncios";
  const linkBlock = announcement.linkUrl
    ? `<p style="margin:20px 0;"><a href="${escapeHtml(announcement.linkUrl)}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${escapeHtml(announcement.linkLabel || "Ver más")}</a></p>`
    : `<p style="margin:20px 0;"><a href="${panelUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver en mi panel</a></p>`;

  let sent = 0;
  for (const affiliate of affiliates) {
    const ok = await sendEmail({
      to: affiliate.email,
      subject: `📣 ${announcement.title} — Caskiuz Affiliates`,
      html: emailShell(`
        <h2 style="margin:0 0 12px;">${escapeHtml(announcement.title)}</h2>
        <p>Hola ${escapeHtml(affiliate.name)},</p>
        <p style="white-space:pre-line;">${escapeHtml(announcement.body)}</p>
        ${linkBlock}
        <p style="font-size:13px;color:#8888a0;">También puedes leerlo cuando quieras en tu panel, sección «Anuncios».</p>
      `),
    });
    if (ok) sent++;
  }

  return { sent, total: affiliates.length, emailConfigured };
}
