import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { verifyUnsubscribeToken } from "@/lib/prospect-outreach";

export const dynamic = "force-dynamic";

function page(title: string, message: string, ok: boolean): NextResponse {
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Caskiuz</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0f;color:#e4e4eb;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px;">
  <div style="max-width:480px;background:#13131a;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px;text-align:center;">
    <div style="font-weight:800;letter-spacing:.6px;font-size:18px;margin-bottom:16px;background:linear-gradient(135deg,#e8ecf1,#9aa7b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">CASKIUZ</div>
    <h1 style="font-size:20px;margin:0 0 10px;">${title}</h1>
    <p style="color:#9a9aae;line-height:1.6;margin:0 0 20px;">${message}</p>
    <a href="https://caskiuz.vercel.app" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:10px;font-size:14px;">Volver al sitio</a>
    ${ok ? "" : '<p style="color:#77778c;font-size:12px;margin-top:18px;">Si el problema continúa, responde al correo que recibiste.</p>'}
  </div>
</body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const id = Number(request.nextUrl.searchParams.get("id"));
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!Number.isInteger(id) || !token) {
    return page("Enlace inválido", "El enlace de baja no es válido.", false);
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: { id: true, email: true, businessName: true },
  });
  if (!prospect || !prospect.email || !verifyUnsubscribeToken(id, prospect.email, token)) {
    return page("Enlace inválido", "El enlace de baja no es válido o ya expiró.", false);
  }

  await prisma.prospect.update({
    where: { id },
    data: { emailOptOut: true, status: "DISCARDED" },
  });

  return page(
    "Baja confirmada",
    `No volveremos a escribir a ${prospect.email.replace(/^(.).*(@.*)$/, "$1***$2")}. Gracias por tu tiempo.`,
    true
  );
}

export async function GET(request: NextRequest) {
  return handle(request);
}

/** One-click unsubscribe (RFC 8058): los clientes de correo hacen POST. */
export async function POST(request: NextRequest) {
  return handle(request);
}
