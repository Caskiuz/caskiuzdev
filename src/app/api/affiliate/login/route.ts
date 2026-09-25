import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { verifyPassword } from "@/lib/password";
import { setAffiliateCookie, clearAffiliateCookie } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Ingresa tu email y contraseña." },
        { status: 400 }
      );
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!affiliate || !verifyPassword(String(password), affiliate.passwordHash)) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos." },
        { status: 401 }
      );
    }

    if (affiliate.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Tu cuenta está suspendida. Contacta a soporte." },
        { status: 403 }
      );
    }

    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { lastLoginAt: new Date() },
    });

    await setAffiliateCookie(affiliate.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en login de afiliado:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAffiliateCookie();
  return NextResponse.json({ success: true });
}
