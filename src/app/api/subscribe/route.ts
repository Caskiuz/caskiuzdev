import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { message: "Ya estás suscrito" },
        { status: 200 }
      );
    }

    await prisma.subscriber.create({ data: { email } });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en suscripción:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}