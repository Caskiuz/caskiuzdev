import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { hashPassword } from "@/lib/password";
import { verifyPurposeToken } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token o contraseña faltante." },
        { status: 400 }
      );
    }
    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const email = await verifyPurposeToken(String(token), "reset");
    if (!email) {
      return NextResponse.json(
        { error: "El enlace de recuperación es inválido o expiró." },
        { status: 400 }
      );
    }

    const affiliate = await prisma.affiliate.findUnique({ where: { email } });
    if (!affiliate) {
      return NextResponse.json({ error: "Cuenta no encontrada." }, { status: 404 });
    }

    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { passwordHash: hashPassword(String(password)) },
    });

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
