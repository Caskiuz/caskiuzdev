import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, company, content, rating } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "El nombre y el comentario son obligatorios" },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "La calificación debe ser entre 1 y 5" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name: name.trim(),
        role: role?.trim() || null,
        company: company?.trim() || null,
        content: content.trim(),
        rating: rating || 5,
        approved: false,
      },
    });

    console.log("💬 Nuevo testimonio de:", testimonial.name);

    return NextResponse.json(
      { success: true, message: "Testimonio enviado. Será revisado antes de publicarse." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al guardar testimonio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Error al obtener testimonios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}