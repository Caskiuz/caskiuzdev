import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendEmail, emailShell, isEmailConfigured } from "@/lib/email";
import { unsubToken } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();

    // Honeypot anti-bots
    if (body?.website) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (!email || !EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing?.active) {
      return NextResponse.json({ message: "Ya estás suscrito" }, { status: 200 });
    }

    if (existing) {
      await prisma.subscriber.update({ where: { email }, data: { active: true } });
    } else {
      await prisma.subscriber.create({ data: { email } });
    }
    console.log("📧 Nuevo suscriptor:", email);

    // Email de bienvenida (Brevo; no bloquea la respuesta si el proveedor falla)
    if (isEmailConfigured()) {
      sendEmail({
        to: email,
        subject: "¡Bienvenido al newsletter de Caskiuz! 🚀",
        html: emailShell(`
          <h2 style="margin:0 0 12px;">¡Bienvenido a bordo! 🎉</h2>
          <p>Recibirás cada mes: artículos nuevos de desarrollo web y automatización, ofertas reales de servicios (desde $149) y recursos para hacer crecer tu negocio con IA.</p>
          <p style="margin:20px 0;"><a href="https://caskiuz.vercel.app/#services" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver servicios y precios</a></p>
          <p style="font-size:13px;color:#8888a0;">¿Conoces a alguien que quiera ganar comisiones recomendando estos servicios? <a href="https://caskiuz.vercel.app/afiliados" style="color:#38bdf8;">Programa de afiliados — hasta 40%</a>.</p>
          <p style="font-size:12px;color:#8888a0;">Puedes darte de baja en cualquier momento desde el enlace al pie de cada correo.</p>
        `),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en suscripción:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/** Baja de la lista: /api/subscribe?e=...&t=... — enlazada al pie de los correos. */
export async function DELETE(request: NextRequest) {
  try {
    const email = (request.nextUrl.searchParams.get("e") || "").trim().toLowerCase();
    const token = request.nextUrl.searchParams.get("t") || "";
    if (!email || !EMAIL_RE.test(email) || token !== unsubToken(email)) {
      return NextResponse.json({ error: "Enlace de baja inválido" }, { status: 400 });
    }
    await prisma.subscriber.updateMany({ where: { email }, data: { active: false } });
    console.log("📧 Baja de newsletter:", email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
