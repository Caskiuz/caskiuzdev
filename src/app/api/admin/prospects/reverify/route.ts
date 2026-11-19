import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { verifyWhatsAppNumber, isUrlAlive, nameMatches } from "@/lib/contact-verifier";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Re-verifica los prospectos PENDIENTES contra la realidad:
 * - contactUrl wa.me → sondeado en wa.me + nombre de cuenta cruzado con el negocio
 * - URLs → comprobadas vivas (HTTP < 400)
 * - El que no pasa NINGÚN canal → DISCARDED (limpia el legado pre-verificación)
 * - El que pasa → contactVerified=true (badge verde)
 *
 * Auth: sesión de admin O Bearer CRON_SECRET (para mantenimiento programático).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const fromCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  const fromAdmin = await isAuthenticated();
  if (!fromCron && !fromAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const prospects = await prisma.prospect.findMany({ where: { status: "NEW" } });

  const results = await Promise.allSettled(
    prospects.map(async (p) => {
      let verified = false;

      // 1) WhatsApp: sondeo real + cruce de nombre
      const waMatch = p.contactUrl?.match(/wa\.me\/(\d{8,15})/) ||
        p.contactUrl?.match(/phone=(\d{8,15})/);
      if (waMatch) {
        const probe = await verifyWhatsAppNumber(waMatch[1]);
        if (probe.exists && nameMatches(p.businessName, probe.profileName)) {
          verified = true;
        }
      }

      // 2) URL de contacto viva (cuando no es wa.me)
      if (!verified && p.contactUrl && /^https?:\/\//.test(p.contactUrl) && !p.contactUrl.includes("wa.me")) {
        verified = await isUrlAlive(p.contactUrl).catch(() => false);
      }

      // 3) Web viva cuenta como canal real aunque no haya WhatsApp
      if (p.siteUrl && /^https?:\/\//.test(p.siteUrl)) {
        const alive = await isUrlAlive(p.siteUrl).catch(() => false);
        if (alive) verified = true;
        else if (!verified) {
          // siteUrl muerta: limpiar el campo, no engañar
          await prisma.prospect.update({ where: { id: p.id }, data: { siteUrl: null } });
        }
      }

      if (verified) {
        await prisma.prospect.update({
          where: { id: p.id },
          data: { contactVerified: true },
        });
        return { id: p.id, name: p.businessName, result: "verified" as const };
      }
      await prisma.prospect.update({
        where: { id: p.id },
        data: { status: "DISCARDED" },
      });
      return { id: p.id, name: p.businessName, result: "discarded" as const };
    })
  );

  let verifiedCount = 0;
  let discardedCount = 0;
  const details: { name: string; result: string }[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value.result === "verified") verifiedCount++;
      else discardedCount++;
      details.push({ name: r.value.name, result: r.value.result });
    }
  }

  console.log(
    `🔍 Re-verificación de prospectos: ${verifiedCount} verificados, ${discardedCount} descartados`
  );
  return NextResponse.json({
    success: true,
    checked: prospects.length,
    verified: verifiedCount,
    discarded: discardedCount,
    details,
  });
}
