import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

/**
 * Registra un lead (contacto) atribuido a un afiliado sin crear una venta.
 * Pensado para conversaciones de WhatsApp: el admin pega el código del
 * mensaje y los datos del cliente y el lead aparece al instante en
 * «Mis leads» del afiliado.
 */
export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { affiliateId, affiliateCode, name, email, service, message } = body;

    const cleanName = String(name || "").trim();
    if (!cleanName) {
      return NextResponse.json({ error: "El nombre del cliente es requerido." }, { status: 400 });
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

    const contact = await prisma.contact.create({
      data: {
        name: cleanName.slice(0, 160),
        email: String(email || "").trim().slice(0, 200),
        service: service ? String(service).trim().slice(0, 120) : null,
        message: String(message || "").trim().slice(0, 2000) || "Lead registrado manualmente desde WhatsApp.",
        affiliateId: affiliate.id,
      },
    });

    console.log(`👤 Lead #${contact.id} registrado para afiliado #${affiliate.id}`);
    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error) {
    console.error("Error registrando lead:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
