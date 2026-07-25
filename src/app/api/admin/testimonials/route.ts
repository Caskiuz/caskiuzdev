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

export async function PATCH(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, approved } = body;

    if (!id || typeof approved !== "boolean") {
      return NextResponse.json(
        { error: "Se requiere id (número) y approved (boolean)" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: { approved },
    });

    console.log(`✅ Testimonio #${id} ${approved ? "aprobado" : "rechazado"}`);

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    console.error("Error al actualizar testimonio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { error: "Se requiere el parámetro id" },
        { status: 400 }
      );
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    await prisma.testimonial.delete({ where: { id } });

    console.log(`🗑️ Testimonio #${id} eliminado`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar testimonio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}