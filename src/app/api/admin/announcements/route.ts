import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { isAnnouncementKind } from "@/lib/announcements";
import { notifyAffiliatesAnnouncement } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

const MAX_TITLE = 160;
const MAX_BODY = 5000;
const MAX_LINK = 500;
const MAX_LINK_LABEL = 80;

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  const authError = await checkAuth();
  if (authError) return authError;

  const [announcements, totalAffiliates] = await Promise.all([
    prisma.announcement.findMany({
      include: { _count: { select: { reads: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.affiliate.count(),
  ]);

  return NextResponse.json({ announcements, totalAffiliates });
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const payload = await request.json();
    const title = String(payload.title ?? "").trim();
    const message = String(payload.body ?? "").trim();
    const kind = isAnnouncementKind(payload.kind) ? payload.kind : "INFO";
    const linkUrl = String(payload.linkUrl ?? "").trim();
    const linkLabel = String(payload.linkLabel ?? "").trim();
    const notifyEmail = payload.notifyEmail === true;

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
    }
    if (title.length > MAX_TITLE) {
      return NextResponse.json(
        { error: `El título no puede pasar de ${MAX_TITLE} caracteres.` },
        { status: 400 }
      );
    }
    if (!message) {
      return NextResponse.json({ error: "El mensaje es obligatorio." }, { status: 400 });
    }
    if (message.length > MAX_BODY) {
      return NextResponse.json(
        { error: `El mensaje no puede pasar de ${MAX_BODY} caracteres.` },
        { status: 400 }
      );
    }
    if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
      return NextResponse.json(
        { error: "El enlace debe empezar por http:// o https://" },
        { status: 400 }
      );
    }
    if (linkUrl.length > MAX_LINK) {
      return NextResponse.json({ error: "El enlace es demasiado largo." }, { status: 400 });
    }

    const startsAt = payload.startsAt ? parseDate(payload.startsAt) : new Date();
    if (!startsAt) {
      return NextResponse.json({ error: "Fecha de inicio inválida." }, { status: 400 });
    }
    const endsAt = parseDate(payload.endsAt);
    if (!endsAt) {
      return NextResponse.json(
        { error: "Indica cuánto tiempo durará el anuncio (fecha de fin)." },
        { status: 400 }
      );
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior al inicio." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: message,
        kind,
        linkUrl: linkUrl || null,
        linkLabel: linkLabel ? linkLabel.slice(0, MAX_LINK_LABEL) : null,
        startsAt,
        endsAt,
      },
    });

    let emailed = 0;
    let totalAffiliates = 0;
    let emailConfigured = false;
    if (notifyEmail) {
      const result = await notifyAffiliatesAnnouncement({
        title: announcement.title,
        body: announcement.body,
        linkUrl: announcement.linkUrl,
        linkLabel: announcement.linkLabel,
      });
      emailed = result.sent;
      totalAffiliates = result.total;
      emailConfigured = result.emailConfigured;
    }

    console.log(
      `📣 Anuncio #${announcement.id} creado (${kind}, hasta ${endsAt.toISOString()})` +
        (notifyEmail ? ` · correos: ${emailed}/${totalAffiliates}` : "")
    );
    return NextResponse.json(
      { success: true, announcement, emailed, totalAffiliates, emailConfigured },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando anuncio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
