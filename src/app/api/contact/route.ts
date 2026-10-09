import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { REFERRAL_COOKIE, VISITOR_COOKIE } from "@/lib/affiliate";
import { resolveAffiliateByRef } from "@/lib/referral-tracking";
import { notifyNewLead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** Ventana en la que un clic previo sigue sirviendo para el rescate por IP. */
const IP_MATCH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Captura leads de contacto. Atribución en 5 capas, en orden:
 * 1) Cookie httpOnly cask_ref (affiliateId:clickId).
 * 2) Código enviado por el formulario (campo oculto/visible): slug o código.
 * 3) Parámetro ?ref= en la URL de la petición.
 * 4) Rescate por IP + User-Agent: solo si TODOS los clics recientes de esa
 *    IP son del mismo afiliado (si hay dos afiliados en la misma IP, no adivina).
 * 5) Sin señales: el lead se guarda sin afiliado pero VISIBLE para el admin
 *    (el buzón muestra "Sin afiliado" y permite asignarlo con un botón).
 * Cada lead queda marcado con attributionSource para auditar cómo se atribuyó.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, service, message, refCode } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    let affiliateId: number | null = null;
    let clickId: number | null = null;
    let attributionSource: string | null = null;

    // 1) Cookie de referido (link único del afiliado)
    const refCookie = request.cookies.get(REFERRAL_COOKIE)?.value;
    if (refCookie) {
      const [rawAffiliateId, rawClickId] = refCookie.split(":");
      const parsedAffiliateId = Number(rawAffiliateId);
      const parsedClickId = Number(rawClickId);
      if (Number.isFinite(parsedAffiliateId) && parsedAffiliateId > 0) {
        affiliateId = parsedAffiliateId;
        clickId = Number.isFinite(parsedClickId) && parsedClickId > 0 ? parsedClickId : null;
        attributionSource = "COOKIE";
      }
    }

    // 2) Código en el body (campo oculto auto-rellenado o escrito a mano).
    //    Acepta el slug (ricardo-agelvis) O el código legado (XARUX5YH).
    const bodyCode = String(refCode || "").trim().slice(0, 60);
    if (!affiliateId && bodyCode) {
      const affiliate = await resolveAffiliateByRef(bodyCode);
      if (affiliate && affiliate.status === "ACTIVE") {
        affiliateId = affiliate.id;
        attributionSource = "CODE";
      }
    }

    // 3) Parámetro ?ref= en la URL de la petición (sobrevive a cookies borradas)
    const urlRef = request.nextUrl.searchParams.get("ref");
    if (!affiliateId && urlRef) {
      const affiliate = await resolveAffiliateByRef(urlRef.slice(0, 60));
      if (affiliate && affiliate.status === "ACTIVE") {
        affiliateId = affiliate.id;
        attributionSource = "URL";
      }
    }

    // 4) Rescate por IP + navegador: última capa cuando no queda ninguna señal
    if (!affiliateId) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      const userAgent = (request.headers.get("user-agent") || "").slice(0, 480);
      if (ip && userAgent) {
        const recentClicks = await prisma.click.findMany({
          where: {
            ip,
            userAgent,
            createdAt: { gte: new Date(Date.now() - IP_MATCH_WINDOW_MS) },
          },
          select: { id: true, affiliateId: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        const distinctAffiliates = new Set(recentClicks.map((c) => c.affiliateId));
        if (recentClicks.length > 0 && distinctAffiliates.size === 1) {
          const candidate = recentClicks[0];
          const affiliate = await prisma.affiliate.findUnique({
            where: { id: candidate.affiliateId },
          });
          if (affiliate && affiliate.status !== "SUSPENDED") {
            affiliateId = candidate.affiliateId;
            clickId = candidate.id;
            attributionSource = "IP_MATCH";
          }
        }
      }
    }

    // Si hay afiliado pero no clickId, enlaza el último clic sin convertir
    // del mismo visitante (cookie cask_visit) para completar el embudo.
    if (affiliateId && !clickId) {
      const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
      if (visitorId) {
        const match = await prisma.click.findFirst({
          where: { affiliateId, visitorId, convertedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (match) clickId = match.id;
      }
    }

    const contact = await prisma.contact.create({
      data: {
        name: String(name).slice(0, 160),
        email: String(email).slice(0, 200),
        service: service ? String(service).slice(0, 60) : null,
        message: String(message).slice(0, 5000),
        affiliateId,
        clickId,
        attributionSource,
      },
    });

    // Marcar el clic como convertido a lead
    if (clickId && affiliateId) {
      await prisma.click.updateMany({
        where: { id: clickId, affiliateId },
        data: { convertedAt: new Date() },
      }).catch(() => {
        // no fatal si el clic ya no existe
      });
    }

    // Avisos internos: al admin siempre, al afiliado si quedó atribuido
    await notifyNewLead(contact.id);

    console.log(
      `📩 Nuevo contacto: ${contact.email}${affiliateId ? ` (afiliado #${affiliateId}, ${attributionSource})` : " (sin afiliado)"}`
    );

    return NextResponse.json({ success: true, id: contact.id }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar contacto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
