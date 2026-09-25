import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, country, phone, avatar, currentPassword, newPassword } = body;

    const data: {
      name?: string;
      country?: string;
      phone?: string | null;
      avatar?: string | null;
      passwordHash?: string;
    } = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return NextResponse.json({ error: "El nombre no puede estar vacío." }, { status: 400 });
      }
      data.name = trimmed.slice(0, 120);
    }
    if (country !== undefined) {
      data.country = String(country).trim().slice(0, 80) || affiliate.country;
    }
    if (phone !== undefined) {
      data.phone = phone ? String(phone).trim().slice(0, 40) : null;
    }
    if (avatar !== undefined) {
      if (avatar === null || avatar === "") {
        data.avatar = null;
      } else if (typeof avatar === "string" && avatar.startsWith("data:image/")) {
        if (avatar.length > 400_000) {
          return NextResponse.json(
            { error: "La imagen es demasiado grande. Máximo ~300KB." },
            { status: 400 }
          );
        }
        data.avatar = avatar;
      } else {
        return NextResponse.json({ error: "Formato de imagen inválido." }, { status: 400 });
      }
    }
    if (newPassword) {
      if (!currentPassword || !verifyPassword(String(currentPassword), affiliate.passwordHash)) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta." },
          { status: 400 }
        );
      }
      if (String(newPassword).length < 8) {
        return NextResponse.json(
          { error: "La nueva contraseña debe tener al menos 8 caracteres." },
          { status: 400 }
        );
      }
      data.passwordHash = hashPassword(String(newPassword));
    }

    const updated = await prisma.affiliate.update({
      where: { id: affiliate.id },
      data,
    });

    return NextResponse.json({ success: true, name: updated.name });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
