import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { hashPassword } from "@/lib/password";
import { generateReferralCode, slugifyName, affiliateRef } from "@/lib/affiliate";
import { createPurposeToken } from "@/lib/affiliate-auth";
import { sendEmail, emailShell } from "@/lib/email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, country, phone, acceptsTerms } = body;

    if (!name || !email || !password || !country) {
      return NextResponse.json(
        { error: "Completa todos los campos requeridos (nombre, email, contraseña y país)." },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(String(email).trim())) {
      return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }
    if (!acceptsTerms) {
      return NextResponse.json(
        { error: "Debes aceptar los Términos y Condiciones del programa." },
        { status: 400 }
      );
    }

    const emailLower = String(email).trim().toLowerCase();
    const existing = await prisma.affiliate.findUnique({ where: { email: emailLower } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email. Inicia sesión." },
        { status: 409 }
      );
    }

    // Código de referido único
    let referralCode = generateReferralCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await prisma.affiliate.findUnique({ where: { referralCode } });
      if (!clash) break;
      referralCode = generateReferralCode();
    }

    // Slug bonito derivado del nombre (ej: ricardo-agelvis), con sufijo si está ocupado
    let slug: string | null = null;
    const baseSlug = slugifyName(String(name));
    if (baseSlug.length >= 3) {
      let candidate = baseSlug.slice(0, 30);
      for (let attempt = 0; attempt < 20; attempt++) {
        const clash = await prisma.affiliate.findUnique({ where: { slug: candidate } });
        if (!clash) {
          slug = candidate;
          break;
        }
        candidate = `${baseSlug.slice(0, 27)}-${attempt + 2}`;
      }
    }

    const affiliate = await prisma.affiliate.create({
      data: {
        email: emailLower,
        passwordHash: hashPassword(String(password)),
        name: String(name).trim().slice(0, 120),
        country: String(country).trim().slice(0, 80),
        phone: phone ? String(phone).trim().slice(0, 40) : null,
        referralCode,
        slug,
        status: "ACTIVE",
        // El contrato del programa se celebra al aceptar los T&C en el registro
        termsAcceptedAt: new Date(),
      },
    });

    // Email de bienvenida + verificación (si Resend está configurado)
    const ref = affiliateRef(affiliate.slug, affiliate.referralCode);
    const verifyToken = await createPurposeToken(affiliate.email, "verify");
    const verifyUrl = `https://caskiuz.vercel.app/api/affiliate/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: affiliate.email,
      subject: "¡Bienvenido a Caskiuz Affiliates! 🚀",
      html: emailShell(`
        <h2 style="margin:0 0 12px;">¡Bienvenido, ${escapeHtml(affiliate.name)}!</h2>
        <p>Tu cuenta de afiliado fue creada correctamente.</p>
        <p><strong>Tu código de referido:</strong> <code style="background:#1c1c28;padding:4px 8px;border-radius:6px;">${affiliate.referralCode}</code></p>
        <p>Tu link único: <a href="https://caskiuz.vercel.app/r/${ref}" style="color:#38bdf8;">caskiuz.vercel.app/r/${ref}</a></p>
        <p>Confirma tu email aquí: <a href="${verifyUrl}" style="color:#38bdf8;">Verificar email</a></p>
      `),
    });

    console.log("🎉 Nuevo afiliado registrado:", affiliate.email);
    return NextResponse.json(
      {
        success: true,
        referralCode: affiliate.referralCode,
        slug: affiliate.slug,
        message: "Cuenta creada. Ya puedes iniciar sesión.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro de afiliado:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}
