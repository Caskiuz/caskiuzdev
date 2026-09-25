import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createPurposeToken } from "@/lib/affiliate-auth";
import { sendEmail, emailShell } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Genera un token de reset y envía el link por email.
 * Siempre responde 200 con el mismo mensaje para no revelar si el email existe.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (email) {
      const affiliate = await prisma.affiliate.findUnique({ where: { email } });
      if (affiliate) {
        const token = await createPurposeToken(affiliate.email, "reset");
        const resetUrl = `https://caskiuz.vercel.app/afiliados/restablecer?token=${token}`;
        await sendEmail({
          to: affiliate.email,
          subject: "Restablece tu contraseña — Caskiuz Affiliates",
          html: emailShell(`
            <h2 style="margin:0 0 12px;">Restablecer contraseña</h2>
            <p>Solicitaste restablecer tu contraseña de Caskiuz Affiliates.</p>
            <p><a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Restablecer contraseña</a></p>
            <p style="margin-top:16px;font-size:13px;color:#8888a0;">El enlace expira en 1 hora. Si no lo solicitaste, ignora este correo.</p>
          `),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Si el email existe, recibirás un enlace de recuperación.",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
