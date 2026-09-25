import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { syncSaleCommission, releaseMaturedCommissions } from "@/lib/commissions";

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

  await releaseMaturedCommissions();

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
    const { affiliateId, contactId, serviceTitle, amount, status } = body;

    const parsedAmount = Number(amount);
    const parsedAffiliateId = Number(affiliateId);
    if (!Number.isFinite(parsedAffiliateId) || parsedAffiliateId <= 0 || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Afiliado y monto (mayor a 0) son requeridos." },
        { status: 400 }
      );
    }
    if (!serviceTitle) {
      return NextResponse.json({ error: "El nombre del servicio es requerido." }, { status: 400 });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: parsedAffiliateId },
    });
    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado no encontrado." }, { status: 404 });
    }

    const sale = await prisma.sale.create({
      data: {
        affiliateId: affiliate.id,
        contactId: contactId ? Number(contactId) : null,
        serviceTitle: String(serviceTitle).slice(0, 160),
        amount: parsedAmount,
        status: ["LEAD", "DEPOSIT_PAID", "FULLY_PAID"].includes(status) ? status : "LEAD",
      },
    });

    await syncSaleCommission(sale.id);

    console.log(`🛒 Venta #${sale.id} creada para afiliado #${affiliate.id}`);
    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    console.error("Error creando venta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
