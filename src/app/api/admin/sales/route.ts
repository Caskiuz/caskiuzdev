import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { syncSaleCommission } from "@/lib/commissions";
import { notifyAffiliateSale, notifyLeadAssigned } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const authError = await checkAuth();
  if (authError) return authError;

  const sales = await prisma.sale.findMany({
    include: {
      affiliate: { select: { id: true, name: true, email: true, referralCode: true } },
      contact: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(sales);
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      affiliateId,
      affiliateCode,
      contactId,
      serviceTitle,
      amount,
      status,
      source,
      clientName,
      clientEmail,
    } = body;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "El monto (mayor a 0) es requerido." },
        { status: 400 }
      );
    }
    if (!serviceTitle) {
      return NextResponse.json({ error: "El nombre del servicio es requerido." }, { status: 400 });
    }

    // Resolver afiliado: por ID o por código/slug (para pegar el código del chat)
    let resolvedAffiliateId = Number(affiliateId);
    if ((!Number.isFinite(resolvedAffiliateId) || resolvedAffiliateId <= 0) && affiliateCode) {
      const raw = String(affiliateCode).trim();
      const found =
        (await prisma.affiliate.findFirst({ where: { slug: raw.toLowerCase() } })) ??
        (await prisma.affiliate.findUnique({ where: { referralCode: raw.toUpperCase() } }));
      if (found) resolvedAffiliateId = found.id;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: resolvedAffiliateId },
    });
    if (!affiliate) {
      return NextResponse.json(
        { error: "Afiliado no encontrado. Verifica el código de referido." },
        { status: 404 }
      );
    }

    // Lead automático: si el admin trae datos del cliente desde WhatsApp,
    // se crea el contacto atribuido al afiliado (visible en «Mis leads»).
    let resolvedContactId = contactId ? Number(contactId) : null;
    const hasClientData = Boolean(String(clientName || "").trim() || String(clientEmail || "").trim());
    if (!resolvedContactId && hasClientData) {
      const contact = await prisma.contact.create({
        data: {
          name: String(clientName || "Cliente WhatsApp").slice(0, 160),
          email: String(clientEmail || "").slice(0, 200),
          message: "Lead registrado manualmente desde el panel de ventas (WhatsApp).",
          affiliateId: affiliate.id,
        },
      });
      resolvedContactId = contact.id;
    }

    const validSources = ["FORM", "WHATSAPP", "MANUAL"];
    const resolvedSource = validSources.includes(source)
      ? source
      : resolvedContactId
        ? "FORM"
        : "MANUAL";

    const sale = await prisma.sale.create({
      data: {
        affiliateId: affiliate.id,
        contactId: resolvedContactId,
        serviceTitle: String(serviceTitle).slice(0, 160),
        amount: parsedAmount,
        status: ["LEAD", "DEPOSIT_PAID", "FULLY_PAID"].includes(status) ? status : "LEAD",
        source: resolvedSource,
      },
    });

    // Cierra el loop: si la venta salió de un lead existente que estaba sin
    // afiliado, se le atribuye al afiliado de la venta y se le avisa por el sistema.
    if (resolvedContactId) {
      const attached = await prisma.contact.updateMany({
        where: { id: resolvedContactId, affiliateId: null },
        data: { affiliateId: affiliate.id, attributionSource: "MANUAL" },
      });
      if (attached.count > 0) {
        await notifyLeadAssigned(resolvedContactId);
      }
    }

    await syncSaleCommission(sale.id);
    await notifyAffiliateSale(sale.id, "created");

    console.log(`🛒 Venta #${sale.id} creada para afiliado #${affiliate.id} (${resolvedSource})`);
    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    console.error("Error creando venta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
