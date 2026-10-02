import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { isAnnouncementKind } from "@/lib/announcements";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const announcementId = Number(id);
    if (!Number.isInteger(announcementId) || announcementId <= 0) {
      return NextResponse.json({ error: "Anuncio inválido." }, { status: 400 });
    }

    const existing = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!existing) {
      return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
    }

    const payload = await request.json();
    const data: {
      title?: string;
      body?: string;
      kind?: string;
      linkUrl?: string | null;
      linkLabel?: string | null;
      active?: boolean;
      startsAt?: Date;
      endsAt?: Date;
    } = {};

    if (payload.title !== undefined) {
      const title = String(payload.title).trim();
      if (!title) {
        return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
      }
      if (title.length > MAX_TITLE) {
        return NextResponse.json(
          { error: `El título no puede pasar de ${MAX_TITLE} caracteres.` },
          { status: 400 }
        );
      }
      data.title = title;
    }

    if (payload.body !== undefined) {
      const message = String(payload.body).trim();
      if (!message) {
        return NextResponse.json({ error: "El mensaje es obligatorio." }, { status: 400 });
      }
      if (message.length > MAX_BODY) {
        return NextResponse.json(
          { error: `El mensaje no puede pasar de ${MAX_BODY} caracteres.` },
          { status: 400 }
        );
      }
      data.body = message;
    }

    if (payload.kind !== undefined) {
      if (!isAnnouncementKind(payload.kind)) {
        return NextResponse.json({ error: "Tipo de anuncio inválido." }, { status: 400 });
      }
      data.kind = payload.kind;
    }

    if (payload.linkUrl !== undefined) {
      const linkUrl = String(payload.linkUrl ?? "").trim();
      if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
        return NextResponse.json(
          { error: "El enlace debe empezar por http:// o https://" },
          { status: 400 }
        );
      }
      if (linkUrl.length > MAX_LINK) {
        return NextResponse.json({ error: "El enlace es demasiado largo." }, { status: 400 });
      }
      data.linkUrl = linkUrl || null;
    }

    if (payload.linkLabel !== undefined) {
      const linkLabel = String(payload.linkLabel ?? "").trim();
      data.linkLabel = linkLabel ? linkLabel.slice(0, MAX_LINK_LABEL) : null;
    }

    if (payload.active !== undefined) {
      data.active = payload.active === true;
    }

    if (payload.startsAt !== undefined) {
      const startsAt = parseDate(payload.startsAt);
      if (!startsAt) {
        return NextResponse.json({ error: "Fecha de inicio inválida." }, { status: 400 });
      }
      data.startsAt = startsAt;
    }

    if (payload.endsAt !== undefined) {
      const endsAt = parseDate(payload.endsAt);
      if (!endsAt) {
        return NextResponse.json({ error: "Fecha de fin inválida." }, { status: 400 });
      }
      data.endsAt = endsAt;
    }

    const effectiveStart = (data.startsAt ?? existing.startsAt).getTime();
    const effectiveEnd = (data.endsAt ?? existing.endsAt).getTime();
    if (effectiveEnd <= effectiveStart) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior al inicio." },
        { status: 400 }
      );
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data,
    });

    console.log(`✏️ Anuncio #${announcementId} actualizado (${Object.keys(data).join(", ")})`);
    return NextResponse.json({ success: true, announcement: updated });
  } catch (error) {
    console.error("Error actualizando anuncio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const announcementId = Number(id);
    if (!Number.isInteger(announcementId) || announcementId <= 0) {
      return NextResponse.json({ error: "Anuncio inválido." }, { status: 400 });
    }

    const existing = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!existing) {
      return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
    }

    await prisma.announcement.delete({ where: { id: announcementId } });

    console.log(`🗑️ Anuncio #${announcementId} eliminado`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando anuncio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
