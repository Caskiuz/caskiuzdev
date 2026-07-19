import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, service, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        service: service || null,
        message,
      },
    });

    console.log("📩 Nuevo contacto:", contact.email);

    return NextResponse.json({ success: true, id: contact.id }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar contacto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
