import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";
import { MIN_WITHDRAWAL } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

/** Campos del método que el panel necesita para etiquetar cada retiro. */
const PAYOUT_METHOD_SELECT = {
  type: true,
  currency: true,
  network: true,
  address: true,
  binanceId: true,
  binanceEmail: true,
  label: true,
  pagoMovilPhone: true,
  pagoMovilBank: true,
  pagoMovilHolder: true,
  pagoMovilId: true,
  accountData: true,
} as const;

export async function GET() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const withdrawals = await prisma.withdrawal.findMany({
    where: { affiliateId: affiliate.id },
    include: {
      payoutMethod: {
        select: PAYOUT_METHOD_SELECT,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(withdrawals);
}

export async function POST(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { payoutMethodId, amount } = body;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Monto inválido." }, { status: 400 });
    }
    if (parsedAmount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `El retiro mínimo es de $${MIN_WITHDRAWAL} USD.` },
        { status: 400 }
      );
    }

    // Gate KYC: documento de identidad aprobado
    const approvedId = await prisma.affiliateDocument.findFirst({
      where: { affiliateId: affiliate.id, type: "ID", status: "APPROVED" },
    });
    if (!approvedId) {
      return NextResponse.json(
        { error: "Debes verificar tu identidad (documento aprobado) antes de retirar. Sube tu documento en la sección Documentos." },
        { status: 403 }
      );
    }

    // Método de pago
    const method = await prisma.payoutMethod.findFirst({
      where: { id: Number(payoutMethodId), affiliateId: affiliate.id },
    });
    if (!method) {
      return NextResponse.json({ error: "Método de pago no encontrado." }, { status: 404 });
    }

    // Retiros en proceso
    const inProcess = await prisma.withdrawal.findFirst({
      where: { affiliateId: affiliate.id, status: { in: ["REQUESTED", "APPROVED"] } },
    });
    if (inProcess) {
      return NextResponse.json(
        { error: "Ya tienes un retiro en proceso. Espera a que se complete." },
        { status: 400 }
      );
    }

    // Saldo disponible (las comisiones están disponibles desde el cobro)
    const available = await prisma.commission.findMany({
      where: { affiliateId: affiliate.id, status: "AVAILABLE" },
      orderBy: { createdAt: "asc" },
    });
    const balance = available.reduce((acc, c) => acc + c.amount, 0);
    if (parsedAmount > balance + 0.0001) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Disponible: $${balance.toFixed(2)} USD.` },
        { status: 400 }
      );
    }

    // Reservar comisiones (FIFO) y crear el retiro
    const withdrawal = await prisma.$transaction(async (tx) => {
      const created = await tx.withdrawal.create({
        data: {
          affiliateId: affiliate.id,
          payoutMethodId: method.id,
          amount: parsedAmount,
          fee: 0,
          netAmount: parsedAmount,
          status: "REQUESTED",
        },
      });

      let remaining = parsedAmount;
      for (const commission of available) {
        if (remaining <= 0.0001) break;
        const take = Math.min(commission.amount, remaining);
        remaining -= take;
        await tx.commission.update({
          where: { id: commission.id },
          data: { status: "WITHDRAWING", withdrawalId: created.id },
        });
      }
      return created;
    });

    console.log(`💸 Retiro solicitado por afiliado #${affiliate.id}: $${parsedAmount}`);

    // El panel inserta el retiro recién creado en el historial y necesita el
    // método de pago para etiquetarlo (mismo shape que el GET).
    const withMethod = await prisma.withdrawal.findUnique({
      where: { id: withdrawal.id },
      include: { payoutMethod: { select: PAYOUT_METHOD_SELECT } },
    });

    return NextResponse.json({ success: true, withdrawal: withMethod ?? withdrawal }, { status: 201 });
  } catch (error) {
    console.error("Error solicitando retiro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
