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

// ─── Centro de notificaciones internas (no depende de email) ───

export type NotificationRecipient = "ADMIN" | "AFFILIATE";
export type NotificationKind =
  | "NEW_LEAD"
  | "LEAD_ASSIGNED"
  | "SALE"
  | "KYC"
  | "WITHDRAWAL"
  | "TICKET"
  | "INFO";

/** Roles de admin a los que se puede dirigir un aviso. */
export type AdminAudienceRole = "GLOBAL" | "AFFILIATES";

const NOTIFICATION_RETENTION_DAYS = 90;

/**
 * Crea una notificación interna (campanita del panel). Nunca lanza errores:
 * si la BD falla, el flujo principal sigue funcionando.
 *
 * Para ADMIN, recipientId es el id del AdminUser (cada admin tiene su propia
 * campana y su propio estado de leído).
 */
export async function notifyInApp(options: {
  recipientType: NotificationRecipient;
  recipientId?: number | null;
  kind?: NotificationKind;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
}): Promise<void> {
  try {
    const recipientId = options.recipientId ?? null;
    await prisma.notification.create({
      data: {
        recipientType: options.recipientType,
        recipientId,
        kind: options.kind ?? "INFO",
        title: options.title.slice(0, 160),
        body: options.body || null,
        linkUrl: options.linkUrl || null,
      },
    });

    // Podar notificaciones viejas del mismo destinatario para que no crezcan sin fin
    const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 3600 * 1000);
    await prisma.notification.deleteMany({
      where: { recipientType: options.recipientType, recipientId, createdAt: { lt: cutoff } },
    });
  } catch (error) {
    console.error("Error creando notificación interna:", error);
  }
}

/**
 * Avisa a TODOS los admins activos (una fila por cuenta, con su propio
 * estado de leído). Opcionalmente se puede limitar por rol.
 */
export async function notifyAdmins(options: {
  kind?: NotificationKind;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  roles?: AdminAudienceRole[];
}): Promise<void> {
  try {
    const admins = await prisma.adminUser.findMany({
      where: {
        active: true,
        ...(options.roles?.length ? { role: { in: options.roles } } : {}),
      },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        notifyInApp({
          recipientType: "ADMIN",
          recipientId: admin.id,
          kind: options.kind,
          title: options.title,
          body: options.body,
          linkUrl: options.linkUrl,
        })
      )
    );
  } catch (error) {
    console.error("Error notificando a los admins:", error);
  }
}

/**
 * Avisa por el sistema cuando llega un lead nuevo:
 * - Al afiliado cuando quedó atribuido a su nombre.
 * - A todos los admins (con enlace al buzón).
 */
export async function notifyNewLead(contactId: number): Promise<void> {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        affiliateId: true,
        affiliate: { select: { id: true, name: true } },
      },
    });
    if (!contact) return;

    if (contact.affiliateId && contact.affiliate) {
      await notifyInApp({
        recipientType: "AFFILIATE",
        recipientId: contact.affiliateId,
        kind: "NEW_LEAD",
        title: `¡Nuevo posible cliente! ${contact.name} te escribió`,
        body: contact.message.slice(0, 280) || contact.email,
        linkUrl: "/afiliados/panel/leads",
      });
    }

    await notifyAdmins({
      kind: "NEW_LEAD",
      title: `Nuevo lead: ${contact.name}`,
      body: contact.affiliate
        ? `Atribuido a ${contact.affiliate.name} · ${contact.email}`
        : `Sin afiliado · ${contact.email}`,
      linkUrl: "/admin/messages",
    });
  } catch (error) {
    console.error("Error notificando lead nuevo:", error);
  }
}

/**
 * Avisa al afiliado cuando el admin le asigna un lead que estaba sin dueño,
 * y a los admins para que ambos sepan quién lo tomó.
 */
export async function notifyLeadAssigned(contactId: number): Promise<void> {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        name: true,
        email: true,
        affiliateId: true,
        affiliate: { select: { name: true } },
      },
    });
    if (!contact || !contact.affiliateId) return;

    await notifyInApp({
      recipientType: "AFFILIATE",
      recipientId: contact.affiliateId,
      kind: "LEAD_ASSIGNED",
      title: `Te asignaron un posible cliente: ${contact.name}`,
      body: `El equipo de Caskiuz te atribuyó el contacto de ${contact.email}.`,
      linkUrl: "/afiliados/panel/leads",
    });

    await notifyAdmins({
      kind: "LEAD_ASSIGNED",
      title: `Posible cliente asignado: ${contact.name}`,
      body: `Afiliado: ${contact.affiliate?.name ?? "—"} · ${contact.email}`,
      linkUrl: "/admin/messages",
    });
  } catch (error) {
    console.error("Error notificando lead asignado:", error);
  }
}

/**
 * Avisa a los admins de cada movimiento de venta (creada, actualizada o
 * eliminada). Un reembolso se anuncia como «Venta reembolsada».
 */
export async function notifyAdminsSale(
  saleId: number,
  event: "created" | "updated" | "deleted"
): Promise<void> {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { affiliate: { select: { name: true } } },
    });
    if (!sale) return;

    const statusLabel = getSaleStatusLabel(sale.status);
    const title =
      event === "created"
        ? `Nueva venta registrada: ${sale.serviceTitle}`
        : event === "deleted"
          ? `Venta eliminada: ${sale.serviceTitle}`
          : sale.status === "REFUNDED"
            ? `Venta reembolsada: ${sale.serviceTitle}`
            : `Venta actualizada: ${sale.serviceTitle}`;

    await notifyAdmins({
      kind: "SALE",
      title,
      body: `Afiliado: ${sale.affiliate.name} · Monto: $${sale.amount.toFixed(2)} USD · Estado: ${statusLabel}`,
      linkUrl: "/admin/sales",
    });
  } catch (error) {
    console.error("Error notificando venta a los admins:", error);
  }
}

/**
 * Notifica al afiliado por email cuando se registra una venta a su nombre
 * o cuando cambia el estado de cobro de una venta existente.
 * Degrada silenciosamente si el proveedor de correo no está configurado.
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

    // Aviso interno en el panel (el canal principal: no depende de email)
    await notifyInApp({
      recipientType: "AFFILIATE",
      recipientId: sale.affiliateId,
      kind: "SALE",
      title:
        event === "created"
          ? `Nueva venta registrada: ${sale.serviceTitle}`
          : `Tu venta cambió de estado: ${sale.serviceTitle}`,
      body: `Monto: $${sale.amount.toFixed(2)} USD · Estado: ${statusLabel} · Tu comisión: $${sale.commissionTotal.toFixed(2)} USD`,
      linkUrl: "/afiliados/panel/comisiones",
    });

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
        <p style="font-size:13px;color:#8888a0;">Tu comisión ya quedó disponible: puedes retirarla desde $15 USD.</p>
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
