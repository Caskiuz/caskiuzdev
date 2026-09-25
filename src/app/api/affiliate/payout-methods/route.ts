import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";
import {
  validateWalletAddress,
  validateBinancePayInput,
  SUPPORTED_CURRENCIES,
} from "@/lib/affiliate";

export const dynamic = "force-dynamic";

const MAX_METHODS = 5;

export async function GET() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const methods = await prisma.payoutMethod.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(methods);
}

export async function POST(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, binanceId, binanceEmail, currency, network, address, label } = body;

    const count = await prisma.payoutMethod.count({ where: { affiliateId: affiliate.id } });
    if (count >= MAX_METHODS) {
      return NextResponse.json(
        { error: `Puedes registrar hasta ${MAX_METHODS} métodos de pago.` },
        { status: 400 }
      );
    }

    if (type === "BINANCE_PAY") {
      const idOk = binanceId ? validateBinancePayInput("BINANCE_ID", binanceId) : false;
      const emailOk = binanceEmail ? validateBinancePayInput("BINANCE_EMAIL", binanceEmail) : false;
      if (!idOk && !emailOk) {
        return NextResponse.json(
          { error: "Ingresa un Binance ID numérico válido o el email de tu cuenta Binance." },
          { status: 400 }
        );
      }
      const method = await prisma.payoutMethod.create({
        data: {
          affiliateId: affiliate.id,
          type: "BINANCE_PAY",
          binanceId: idOk ? String(binanceId).trim() : null,
          binanceEmail: emailOk ? String(binanceEmail).trim().toLowerCase() : null,
          currency: "USDT",
          network: null,
          address: null,
          label: label ? String(label).slice(0, 40) : "Binance Pay",
          isDefault: count === 0,
        },
      });
      return NextResponse.json({ success: true, method }, { status: 201 });
    }

    if (type === "WALLET") {
      const currencyStr = String(currency || "");
      const networkStr = String(network || "");
      const supported = SUPPORTED_CURRENCIES.find((c) => c.code === currencyStr);
      if (!supported) {
        return NextResponse.json({ error: "Moneda no soportada." }, { status: 400 });
      }
      const networks: readonly string[] = supported.networks;
      const net = networks.includes(networkStr) ? networkStr : "";
      if (!net) {
        return NextResponse.json(
          { error: `Red no válida para ${currencyStr}. Redes soportadas: ${networks.join(", ")}.` },
          { status: 400 }
        );
      }
      if (!validateWalletAddress(net, String(address || ""))) {
        return NextResponse.json(
          { error: `La dirección no es válida para la red ${net}. Verifica que la red sea correcta antes de enviar fondos.` },
          { status: 400 }
        );
      }
      const method = await prisma.payoutMethod.create({
        data: {
          affiliateId: affiliate.id,
          type: "WALLET",
          binanceId: null,
          binanceEmail: null,
          currency,
          network: net,
          address: String(address).trim(),
          label: label ? String(label).slice(0, 40) : `${currency} (${net})`,
          isDefault: count === 0,
        },
      });
      return NextResponse.json({ success: true, method }, { status: 201 });
    }

    return NextResponse.json({ error: "Tipo de método inválido." }, { status: 400 });
  } catch (error) {
    console.error("Error creando método de pago:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  const method = await prisma.payoutMethod.findFirst({
    where: { id, affiliateId: affiliate.id },
  });
  if (!method) {
    return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });
  }

  const pending = await prisma.withdrawal.findFirst({
    where: { payoutMethodId: id, status: { in: ["REQUESTED", "APPROVED"] } },
  });
  if (pending) {
    return NextResponse.json(
      { error: "No puedes eliminar un método con retiros en proceso." },
      { status: 400 }
    );
  }

  await prisma.payoutMethod.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
