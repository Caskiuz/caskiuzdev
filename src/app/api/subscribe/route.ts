import { NextRequest, NextResponse } from "next/server";

const subscribers: Set<string> = new Set();

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

    if (subscribers.has(email)) {
      return NextResponse.json(
        { message: "Ya estás suscrito" },
        { status: 200 }
      );
    }

    subscribers.add(email);
    console.log("📧 Nuevo suscriptor:", email);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en suscripción:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}