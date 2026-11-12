import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { REFERRAL_COOKIE, VISITOR_COOKIE } from "@/lib/affiliate";
import { resolveAffiliateByRef } from "@/lib/referral-tracking";
import { notifyNewLead } from "@/lib/notifications";
import { scoreLead, draftVisitorReply } from "@/lib/lead-ai";
import { sendEmail, emailShell, isEmailConfigured } from "@/lib/email";

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
 *
 * Anti-bots sin fricción: honeypot invisible (campo "website") — si viene
 * lleno se responde 201 pero NO se guarda nada.
 *
 * Después de responder, en segundo plano (`after`): la IA puntúa el lead
 * 0-100, redacta propuesta preliminar + primer mensaje WhatsApp, se notifica
 * al admin (campanita + email + Telegram) y se auto-responde al visitante.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, phone, service, message, refCode, source, website } = body;

    // Honeypot: los bots rellenan todos los campos; los humanos no ven este.
    if (website) {
      return NextResponse.json({ success: true, id: 0 }, { status: 201 });
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Canal del lead (whitelist; el inventario de afiliados usa ADMIN)
    const leadSource =
      source === "CHAT" || source === "ADMIN" || source === "PROSPECT"
        ? (source as string)
        : "FORM";

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
        phone: phone ? String(phone).slice(0, 40) : null,
        service: service ? String(service).slice(0, 60) : null,
        message: String(message).slice(0, 5000),
        source: leadSource,
        status: "NEW",
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

    console.log(
      `📩 Nuevo contacto: ${contact.email}${affiliateId ? ` (afiliado #${affiliateId}, ${attributionSource})` : " (sin afiliado)"}${leadSource !== "FORM" ? ` [${leadSource}]` : ""}`
    );

    // Inteligencia + avisos EN SEGUNDO PLANO: la respuesta al visitante
    // sale ya; la IA y los emails no la bloquean.
    after(async () => {
      try {
        const leadInput = {
          name: contact.name,
          email: contact.email,
          service: contact.service,
          message: contact.message,
          source: leadSource,
        };

        const [intel, reply] = await Promise.all([
          scoreLead(leadInput).catch(() => null),
          isEmailConfigured() ? draftVisitorReply(leadInput).catch(() => null) : null,
        ]);

        if (intel) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              score: intel.score,
              aiSummary: intel.summary,
              aiProposal: intel.proposal,
              aiDraftMsg: intel.draftMsg,
            },
          });
        }

        // Avisos internos: al admin siempre (campanita + email + Telegram),
        // al afiliado si quedó atribuido.
        await notifyNewLead(contact.id);

        // Auto-respuesta personalizada al visitante (capa de cortesía)
        if (reply) {
          await sendEmail({
            to: contact.email,
            subject: "Recibí tu mensaje — Caskiuz",
            html: emailShell(
              reply
                .split("\n")
                .map((line) => `<p style="margin:0 0 10px;">${line}</p>`)
                .join("")
            ),
          }).catch(() => {});
        }
      } catch (error) {
        console.error("Error en el post-procesado del lead:", error);
      }
    });

    return NextResponse.json({ success: true, id: contact.id }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar contacto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
