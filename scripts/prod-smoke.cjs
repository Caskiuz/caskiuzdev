/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Smoke test en producción (https://caskiuz.vercel.app) con un afiliado temporal.
 * Uso: node scripts/prod-smoke.cjs
 * Espera el deploy nuevo, prueba bot/humano/contacto/notificaciones y limpia TODO.
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const BASE = "https://caskiuz.vercel.app";

const UA_HUMAN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ProdSmoke/1.0 Safari/537.36";
const ACCEPT_HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const SLUG = "prod-tmp-aff";
const CODE = "PRDTMP9Z";

function getCookie(setCookieHeaders, name) {
  for (const h of setCookieHeaders) {
    if (h.startsWith(name + "=")) return h.split(";")[0].slice(name.length + 1);
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cleanup(tempId, baselineNotifId) {
  console.log("\n🧹 Limpiando datos de prueba en producción…");
  await prisma.contact.deleteMany({ where: { email: "prod-smoke@example.com" } });
  await prisma.notification.deleteMany({ where: { id: { gt: baselineNotifId } } });
  const aff = await prisma.affiliate.deleteMany({ where: { slug: SLUG } });
  const clicks = await prisma.click.count({
    where: { affiliateId: tempId },
  });
  console.log(`afiliado temporal: ${aff.count} · clics restantes: ${clicks}`);
}

async function main() {
  const notifMax = await prisma.notification.aggregate({ _max: { id: true } });
  const baselineNotifId = notifMax._max.id ?? 0;

  await prisma.contact.deleteMany({ where: { email: "prod-smoke@example.com" } });
  await prisma.affiliate.deleteMany({ where: { slug: SLUG } });

  const temp = await prisma.affiliate.create({
    data: {
      email: "prod-smoke@example.com",
      passwordHash: "test",
      name: "Prod Smoke Test",
      country: "Venezuela",
      status: "ACTIVE",
      tier: "SILVER",
      referralCode: CODE,
      slug: SLUG,
    },
  });
  console.log(`Afiliado temporal creado (id=${temp.id})`);

  // 1) Esperar a que el deploy nuevo esté vivo: el redirect debe llevar ?ref=
  let deployed = false;
  let caskVisit = null;
  let caskRef = null;
  for (let attempt = 1; attempt <= 40; attempt++) {
    const res = await fetch(`${BASE}/r/${SLUG}`, {
      redirect: "manual",
      headers: {
        "User-Agent": UA_HUMAN,
        Accept: ACCEPT_HTML,
        ...(caskVisit ? { Cookie: `cask_visit=${caskVisit}` } : {}),
      },
    });
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    caskVisit = getCookie(setCookies, "cask_visit") || caskVisit;
    caskRef = getCookie(setCookies, "cask_ref") || caskRef;
    const location = res.headers.get("location") || "";
    if (location.includes(`ref=${SLUG}`) && caskVisit) {
      console.log(`✅ Deploy nuevo detectado en el intento ${attempt}: ${location}`);
      deployed = true;
      break;
    }
    process.stdout.write(`⏳ intento ${attempt} (deploy aún no listo)…\r`);
    await sleep(15000);
  }
  if (!deployed) {
    console.log("\n❌ El deploy nuevo no se detectó en 10 minutos.");
    await cleanup(temp.id, baselineNotifId);
    process.exit(1);
  }

  // 2) Bot en producción: redirige sin crear clic
  const botRes = await fetch(`${BASE}/r/${SLUG}`, {
    redirect: "manual",
    headers: {
      "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    },
  });
  const botClicks = await prisma.click.count({
    where: { affiliateId: temp.id, userAgent: { contains: "facebookexternalhit" } },
  });
  console.log(
    `bot: status=${botRes.status} (${botRes.status >= 300 && botRes.status < 400 ? "redirige ✓" : "¡NO redirige!"}) · clics de bot=${botClicks} ${botClicks === 0 ? "✓" : "¡FALLO!"}`
  );

  // 3) Atribución por cookie en producción + notificación al admin
  if (!caskRef) {
    console.log("❌ No se obtuvo cask_ref del click humano.");
    await cleanup(temp.id, baselineNotifId);
    process.exit(1);
  }
  const contactRes = await fetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `cask_ref=${caskRef}` },
    body: JSON.stringify({
      name: "Prod Smoke Test",
      email: "prod-smoke@example.com",
      message: "smoke test de atribución en producción",
    }),
  });
  const contactJson = await contactRes.json().catch(() => ({}));
  const contact = await prisma.contact.findUnique({ where: { id: contactJson.id } });
  console.log(
    `contacto: status=${contactRes.status} · attributionSource=${contact?.attributionSource} · affiliateId=${contact?.affiliateId} ${
      contact?.attributionSource === "COOKIE" && contact?.affiliateId === temp.id ? "✓" : "¡FALLO!"
    }`
  );

  const adminNotif = await prisma.notification.count({
    where: { recipientType: "ADMIN", kind: "NEW_LEAD", title: { contains: "Prod Smoke Test" } },
  });
  const affNotif = await prisma.notification.count({
    where: { recipientType: "AFFILIATE", recipientId: temp.id, kind: "NEW_LEAD" },
  });
  console.log(`notificaciones: admin=${adminNotif} ${adminNotif >= 1 ? "✓" : "¡FALLO!"} · afiliado=${affNotif} ${affNotif >= 1 ? "✓" : "¡FALLO!"}`);

  // 4) Panel admin: la página de notificaciones muestra el aviso
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  const loginSetCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
  const adminToken = getCookie(loginSetCookies, "admin_token");
  if (adminToken) {
    const pageRes = await fetch(`${BASE}/admin/notificaciones`, {
      headers: { Cookie: `admin_token=${adminToken}` },
    });
    const pageText = await pageRes.text();
    console.log(
      `admin/notificaciones: status=${pageRes.status} · contiene el aviso=${pageText.includes("Prod Smoke Test") ? "✓" : "¡FALLO!"}`
    );
  } else {
    console.log("❌ No se pudo iniciar sesión de admin en producción.");
  }

  // 5) Inbox admin en producción: muestra "Sin afiliado" para leads sin dueño
  const orphanRes = await fetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "NoSignalProd/1.0" },
    body: JSON.stringify({
      name: "Prod Smoke Orphan",
      email: "prod-smoke@example.com",
      message: "lead sin señales en producción",
    }),
  });
  const orphan = await prisma.contact.findFirst({
    where: { name: "Prod Smoke Orphan" },
    orderBy: { id: "desc" },
  });
  console.log(
    `lead sin señales: status=${orphanRes.status} · affiliateId=${orphan?.affiliateId ?? "nulo"} ${
      orphan && orphan.affiliateId === null ? "✓" : "¡FALLO!"
    }`
  );

  await cleanup(temp.id, baselineNotifId);
  console.log("\n✅ Smoke test de producción completado.");
}

main()
  .catch(async (error) => {
    console.error("\n💥 Error en el smoke test:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
