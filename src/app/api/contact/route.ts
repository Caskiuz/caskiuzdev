import { NextRequest, NextResponse } from "next/server";

const contacts: Array<{
  id: number;
  name: string;
  email: string;
  service: string | null;
  message: string;
  createdAt: Date;
}> = [];
let contactIdCounter = 1;

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

    const contact = {
      id: contactIdCounter++,
      name,
      email,
      service: service || null,
      message,
      createdAt: new Date(),
    };

    contacts.push(contact);
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