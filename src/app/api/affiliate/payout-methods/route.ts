import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";
import {
  validateWalletAddress,
  validateBinancePayInput,
  SUPPORTED_CURRENCIES,
  BANCOLOMBIA_ACCOUNT_TYPES,
  normalizeBancolombiaAccount,
  normalizeColombianPhone,
  normalizeZelleAccount,
} from "@/lib/affiliate";

export const dynamic = "force-dynamic";

const MAX_METHODS = 6;

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
    const {
      type,
      binanceId,
      binanceEmail,
      currency,
      network,
      address,
      label,
      pagoMovilPhone,
      pagoMovilBank,
      pagoMovilHolder,
      pagoMovilId,
      accountData,
    } = body;

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

    // Pago Móvil: cobro de comisiones EXCLUSIVO para afiliados en Venezuela
    if (type === "PAGO_MOVIL") {
      if (affiliate.country !== "Venezuela") {
        return NextResponse.json(
          { error: "Pago Móvil es exclusivo para afiliados en Venezuela. Si estás en Venezuela, actualiza tu país en el perfil." },
          { status: 403 }
        );
      }
      const phone = String(pagoMovilPhone || "").trim();
      const bank = String(pagoMovilBank || "").trim();
      const holder = String(pagoMovilHolder || "").trim();
      const docId = String(pagoMovilId || "").trim();

      if (!/^0(412|414|416|424|426)[-\s]?\d{7}$/.test(phone)) {
        return NextResponse.json(
          { error: "Teléfono Pago Móvil inválido. Formato: 04XX-XXXXXXX (operadora venezolana)." },
          { status: 400 }
        );
      }
      if (!bank || !holder || !docId) {
        return NextResponse.json(
          { error: "Banco, titular y cédula son obligatorios para Pago Móvil." },
          { status: 400 }
        );
      }

      const method = await prisma.payoutMethod.create({
        data: {
          affiliateId: affiliate.id,
          type: "PAGO_MOVIL",
          binanceId: null,
          binanceEmail: null,
          currency: "VES",
          network: null,
          address: null,
          pagoMovilPhone: phone,
          pagoMovilBank: bank.slice(0, 80),
          pagoMovilHolder: holder.slice(0, 120),
          pagoMovilId: docId.slice(0, 40),
          label: label ? String(label).slice(0, 40) : "Pago Móvil (Venezuela)",
          isDefault: count === 0,
        },
      });
      return NextResponse.json({ success: true, method }, { status: 201 });
    }

    // Métodos locales de Colombia (pesos): Nequi, Daviplata y Bancolombia
    if (type === "NEQUI" || type === "DAVIPLATA" || type === "BANCOLOMBIA") {
      if (affiliate.country !== "Colombia") {
        return NextResponse.json(
          { error: "Estos métodos son exclusivos para afiliados en Colombia. Si estás en Colombia, actualiza tu país en el perfil." },
          { status: 403 }
        );
      }
      const holder = String(accountData?.holder || "").trim();
      if (!holder) {
        return NextResponse.json(
          { error: "El titular de la cuenta es obligatorio." },
          { status: 400 }
        );
      }

      let data: Record<string, string>;
      let defaultLabel: string;

      if (type === "BANCOLOMBIA") {
        const accountType = String(accountData?.accountType || "").trim();
        if (!(BANCOLOMBIA_ACCOUNT_TYPES as readonly string[]).includes(accountType)) {
          return NextResponse.json(
            { error: "Tipo de cuenta inválido. Elige Ahorros o Corriente." },
            { status: 400 }
          );
        }
        const accountNumber = normalizeBancolombiaAccount(String(accountData?.accountNumber || ""));
        if (!accountNumber) {
          return NextResponse.json(
            { error: "Número de cuenta Bancolombia inválido (de 8 a 17 dígitos)." },
            { status: 400 }
          );
        }
        data = { accountType, accountNumber };
        defaultLabel = "Bancolombia (Colombia)";
      } else {
        const phone = normalizeColombianPhone(String(accountData?.phone || ""));
        if (!phone) {
          return NextResponse.json(
            { error: "Teléfono inválido. Debe ser un móvil colombiano de 10 dígitos que empiece por 3." },
            { status: 400 }
          );
        }
        data = { phone };
        defaultLabel = type === "NEQUI" ? "Nequi (Colombia)" : "Daviplata (Colombia)";
      }

      const method = await prisma.payoutMethod.create({
        data: {
          affiliateId: affiliate.id,
          type,
          binanceId: null,
          binanceEmail: null,
          currency: "COP",
          network: null,
          address: null,
          accountData: { ...data, holder: holder.slice(0, 120) },
          label: label ? String(label).slice(0, 40) : defaultLabel,
          isDefault: count === 0,
        },
      });
      return NextResponse.json({ success: true, method }, { status: 201 });
    }

    // Zelle: cobro de comisiones EXCLUSIVO para afiliados en Estados Unidos
    if (type === "ZELLE") {
      if (affiliate.country !== "Estados Unidos") {
        return NextResponse.json(
          { error: "Zelle es exclusivo para afiliados en Estados Unidos. Si estás en EE. UU., actualiza tu país en el perfil." },
          { status: 403 }
        );
      }
      const account = normalizeZelleAccount(String(accountData?.account || ""));
      const holder = String(accountData?.holder || "").trim();
      if (!account) {
        return NextResponse.json(
          { error: "Ingresa un email o un teléfono de EE. UU. (10 dígitos) válido para Zelle." },
          { status: 400 }
        );
      }
      if (!holder) {
        return NextResponse.json(
          { error: "El titular de la cuenta Zelle es obligatorio." },
          { status: 400 }
        );
      }
      const method = await prisma.payoutMethod.create({
        data: {
          affiliateId: affiliate.id,
          type: "ZELLE",
          binanceId: null,
          binanceEmail: null,
          currency: "USD",
          network: null,
          address: null,
          accountData: { account, holder: holder.slice(0, 120) },
          label: label ? String(label).slice(0, 40) : "Zelle (Estados Unidos)",
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
