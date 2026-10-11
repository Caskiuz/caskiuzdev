/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * E2E local de PayPal + mínimo de retiro: registro de afiliado temporal en
 * CHILE (país sin método local → prueba que PayPal es global) → método PAYPAL
 * válido (201) → negativos (email inválido 400, sin titular 400) → Pago Móvil
 * sigue bloqueado fuera de Venezuela (403) → retiro de $10 rechazado (mínimo
 * $15) → con KYC y saldo inyectados, retiro de $15 aceptado (201) → el admin
 * ve "PayPal (USD)" en la ficha del afiliado. Limpia TODO al final.
 * Uso: node scripts/e2e-paypal-test.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const BASE = process.env.BASE_URL || "http://localhost:3210";
const EMAIL = "tmp-paypal-test@example.com";
const PASSWORD = "TestPaypal12345";
const NAME = "Prueba PayPal Test";
const PAYPAL_EMAIL = "Prueba.PayPal@example.com"; // el API debe normalizar a minúsculas

const results = [];
function assert(cond, name, detail) {
  results.push(`${cond ? "✅" : "❌"} ${name}${cond ? "" : `: ${detail || "falló"}`}`);
  if (!cond) console.error(`FAIL ${name}: ${detail}`);
}
function getCookie(setCookieHeaders, name) {
  for (const h of setCookieHeaders) {
    if (h.startsWith(name + "=")) return h.split(";")[0].slice(name.length + 1);
  }
  return null;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

let baselineNotifId = 0;
let baselineReady = false;

/** Reintenta operaciones de BD (Aiven a veces corta la conexión un instante). */
async function withRetry(fn, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw lastError;
}

async function cleanup(affiliateId) {
  console.log("\n🧹 Limpiando datos de prueba…");
  if (affiliateId) {
    await withRetry(() => prisma.withdrawal.deleteMany({ where: { affiliateId } })).catch(() => {});
    await withRetry(() => prisma.commission.deleteMany({ where: { affiliateId } })).catch(() => {});
    await withRetry(() => prisma.sale.deleteMany({ where: { affiliateId } })).catch(() => {});
    await withRetry(() => prisma.affiliateDocument.deleteMany({ where: { affiliateId } })).catch(() => {});
    await withRetry(() => prisma.payoutMethod.deleteMany({ where: { affiliateId } })).catch(() => {});
  }
  // Solo se borran notificaciones si el baseline se capturó con seguridad y
  // solo las de la prueba (afiliado temporal o títulos de prueba).
  let notifCount = 0;
  if (baselineReady) {
    const notif = await prisma.notification
      .deleteMany({
        where: {
          id: { gt: baselineNotifId },
          OR: [
            { recipientId: affiliateId || -1 },
            { title: { contains: "Prueba" } },
          ],
        },
      })
      .catch(() => ({ count: 0 }));
    notifCount = notif.count;
  } else {
    console.warn("⚠️ Baseline de notificaciones no capturado: NO se borran notificaciones (protección).");
  }
  const affDel = await prisma.affiliate.deleteMany({ where: { email: EMAIL } }).catch(() => ({ count: 0 }));
  console.log(`afiliado eliminado (aff=${affDel.count}) · notificaciones=${notifCount}`);
}

async function main() {
  const maxNotif = await withRetry(() => prisma.notification.aggregate({ _max: { id: true } }));
  baselineNotifId = maxNotif._max.id ?? 0;
  baselineReady = true;
  await withRetry(() => prisma.affiliate.deleteMany({ where: { email: EMAIL } }));

  // 1) Registro real del afiliado temporal en CHILE (sin método local → PayPal global)
  const reg = await fetchJson(`${BASE}/api/affiliate/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: NAME,
      email: EMAIL,
      password: PASSWORD,
      country: "Chile",
      phone: "56912345678",
      acceptsTerms: true,
    }),
  });
  assert(reg.status === 201, "registro de afiliado temporal (Chile)", `status=${reg.status} ${reg.json?.error || ""}`);
  const affiliate = await prisma.affiliate.findUnique({ where: { email: EMAIL } });
  assert(Boolean(affiliate), "afiliado existe en BD", "no encontrado");
  const regCookies = reg.headers.getSetCookie ? reg.headers.getSetCookie() : [];
  const affToken = getCookie(regCookies, "affiliate_token");
  assert(Boolean(affToken), "cookie de sesión tras registro", "sin cookie");
  const affHeaders = { "Content-Type": "application/json", Cookie: `affiliate_token=${affToken}` };

  // 2) PAYPAL válido → 201 (global: el afiliado es de Chile)
  const paypalOk = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "PAYPAL", accountData: { account: PAYPAL_EMAIL, holder: "Prueba PayPal" } }),
  });
  assert(paypalOk.status === 201, "método PAYPAL creado (país Chile)", `status=${paypalOk.status} ${paypalOk.json?.error || ""}`);
  const method = paypalOk.json?.method;
  assert(method?.type === "PAYPAL", "tipo guardado es PAYPAL", String(method?.type));
  assert(method?.currency === "USD", "moneda guardada es USD", String(method?.currency));
  assert(method?.accountData?.account === "prueba.paypal@example.com", "email normalizado a minúsculas", String(method?.accountData?.account));
  assert(method?.accountData?.holder === "Prueba PayPal", "titular guardado", String(method?.accountData?.holder));
  assert(method?.isDefault === true, "primer método queda predeterminado", String(method?.isDefault));

  // 3) Negativos: email inválido y sin titular
  const badEmail = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "PAYPAL", accountData: { account: "noesemail", holder: "X" } }),
  });
  assert(badEmail.status === 400, "email inválido rechazado (400)", `status=${badEmail.status}`);
  const noHolder = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "PAYPAL", accountData: { account: "ok@example.com", holder: "  " } }),
  });
  assert(noHolder.status === 400, "sin titular rechazado (400)", `status=${noHolder.status}`);

  // 4) Regresión: Pago Móvil sigue exclusivo de Venezuela
  const pmChile = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({
      type: "PAGO_MOVIL",
      pagoMovilPhone: "0412-1234567",
      pagoMovilBank: "Banco X",
      pagoMovilHolder: "X",
      pagoMovilId: "V-1",
    }),
  });
  assert(pmChile.status === 403, "Pago Móvil sigue bloqueado fuera de Venezuela (403)", `status=${pmChile.status}`);

  // 5) GET devuelve el método PayPal
  const methodsRes = await fetchJson(`${BASE}/api/affiliate/payout-methods`, { headers: affHeaders });
  assert(methodsRes.status === 200 && methodsRes.json?.length === 1, "GET métodos devuelve el PayPal", `status=${methodsRes.status}, n=${methodsRes.json?.length}`);
  assert(methodsRes.json?.[0]?.type === "PAYPAL", "GET devuelve tipo PAYPAL", methodsRes.json?.[0]?.type);

  // 6) Mínimo de retiro: $10 rechazado ($15 mínimo) — se valida antes del KYC
  const w10 = await fetchJson(`${BASE}/api/affiliate/withdrawals`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ payoutMethodId: method.id, amount: 10 }),
  });
  assert(w10.status === 400 && /retiro mínimo es de \$15/i.test(w10.json?.error || ""), "retiro de $10 rechazado (mínimo $15)", `status=${w10.status} ${w10.json?.error || ""}`);

  // 7) Inyectar KYC aprobado + comisión disponible para probar el retiro de $15
  const doc = await withRetry(() =>
    prisma.affiliateDocument.create({
      data: {
        affiliateId: affiliate.id,
        type: "ID",
        fileName: "prueba-id.png",
        fileData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        status: "APPROVED",
        notes: "Documento de prueba automatizada (E2E PayPal).",
      },
    })
  );
  assert(Boolean(doc), "documento KYC aprobado inyectado", "falló");
  const sale = await withRetry(() =>
    prisma.sale.create({
      data: {
        affiliateId: affiliate.id,
        serviceTitle: "Venta de prueba E2E PayPal",
        amount: 15,
        status: "FULLY_PAID",
        source: "MANUAL",
        commissionRate: 0.1,
        commissionTotal: 1.5,
        collectedAmount: 15,
        paidAt: new Date(),
      },
    })
  );
  const commission = await withRetry(() =>
    prisma.commission.create({
      data: {
        saleId: sale.id,
        affiliateId: affiliate.id,
        amount: 15,
        status: "AVAILABLE",
        availableAt: new Date(),
      },
    })
  );
  assert(Boolean(commission), "comisión disponible inyectada", "falló");

  // 8) Retiro de $15 aceptado
  const w15 = await fetchJson(`${BASE}/api/affiliate/withdrawals`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ payoutMethodId: method.id, amount: 15 }),
  });
  assert(w15.status === 201, "retiro de $15 aceptado", `status=${w15.status} ${w15.json?.error || ""}`);
  assert(w15.json?.withdrawal?.status === "REQUESTED", "retiro queda REQUESTED", String(w15.json?.withdrawal?.status));
  const commissionAfter = await prisma.commission.findUnique({ where: { id: commission.id } });
  assert(commissionAfter.status === "WITHDRAWING", "comisión reservada (WITHDRAWING)", commissionAfter.status);

  // 9) El retiro viaja con el método PayPal
  const wList = await fetchJson(`${BASE}/api/affiliate/withdrawals`, { headers: affHeaders });
  assert(wList.json?.[0]?.payoutMethod?.type === "PAYPAL", "retiro referencia el método PAYPAL", String(wList.json?.[0]?.payoutMethod?.type));
  assert(wList.json?.[0]?.payoutMethod?.accountData?.account === "prueba.paypal@example.com", "el admin vería el email PayPal en el retiro", String(wList.json?.[0]?.payoutMethod?.accountData?.account));

  // 10) Admin: la ficha del afiliado muestra "PayPal (USD)"
  const loginRes = await fetchJson(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  const adminToken = getCookie(loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [], "admin_token");
  assert(Boolean(adminToken), "admin login", `status=${loginRes.status}`);
  const adminPage = await fetchJson(`${BASE}/admin/affiliates/${affiliate.id}`, {
    headers: { Cookie: `admin_token=${adminToken}` },
  });
  assert(adminPage.status === 200, "página del afiliado en admin carga", `status=${adminPage.status}`);
  assert(adminPage.text.includes("PayPal (USD)"), "la ficha admin muestra 'PayPal (USD)'", "texto no encontrado");
  assert(adminPage.text.includes("prueba.paypal@example.com"), "la ficha admin muestra el email PayPal", "texto no encontrado");

  return affiliate.id;
}

let tempAffId = null;
main()
  .then(async (affId) => {
    tempAffId = affId;
    console.log("\n────────── RESULTADOS ──────────");
    results.forEach((r) => console.log(r));
    const failed = results.filter((r) => r.startsWith("❌")).length;
    console.log(`\n${failed === 0 ? "🎉 TODOS PASARON" : `⚠️ ${failed} fallaron`}`);
    await cleanup(tempAffId);
    await prisma.$disconnect();
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error("\n💥 Error:", error);
    await cleanup(tempAffId);
    await prisma.$disconnect();
    process.exit(1);
  });
