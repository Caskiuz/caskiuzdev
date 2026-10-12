/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * E2E local de Yape (Perú) para retiros de afiliados: registro de afiliado
 * temporal en PERÚ → método YAPE con "+51 987 654 321" (201, teléfono
 * normalizado a 9 dígitos, moneda PEN) → negativos (sin empezar por 9, pocos
 * dígitos, teléfono colombiano, sin titular) → Yape bloqueado para un afiliado
 * de otro país (403) → tolerancia de acentos: país "Peru" (sin tilde) también
 * permite Yape → retiro de $10 rechazado (mínimo $15) → con KYC y saldo
 * inyectados, retiro de $15 aceptado (201) → el admin ve "Yape (PEN)" y el
 * teléfono en la ficha del afiliado y "Pagar en soles" en la cola de retiros.
 * Limpia TODO al final.
 * Uso: node scripts/e2e-yape-test.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const BASE = process.env.BASE_URL || "http://localhost:3210";
const EMAIL = "tmp-yape-test@example.com";
const EMAIL_BLOCKED = "tmp-yape-blocked@example.com";
const PASSWORD = "TestYape12345";
const NAME = "Prueba Yape Perú";
const YAPE_PHONE = "987654321"; // se envía "+51 987 654 321"

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

async function registerAffiliate(email, name, country, phone) {
  const reg = await fetchJson(`${BASE}/api/affiliate/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password: PASSWORD, country, phone, acceptsTerms: true }),
  });
  const cookies = reg.headers.getSetCookie ? reg.headers.getSetCookie() : [];
  return { status: reg.status, error: reg.json?.error, token: getCookie(cookies, "affiliate_token") };
}

async function cleanup(affiliateIds) {
  console.log("\n🧹 Limpiando datos de prueba…");
  for (const affiliateId of affiliateIds.filter(Boolean)) {
    await withRetry(() => prisma.withdrawal.deleteMany({ where: { affiliateId } })).catch(() => {});
    await withRetry(() => prisma.commission.deleteMany({ where: { affiliateId } })).catch(() => {});
    await withRetry(() => prisma.sale.deleteMany({ where: { affiliateId } })).catch(() => {});
    await withRetry(() => prisma.affiliateDocument.deleteMany({ where: { affiliateId } })).catch(() => {});
    await withRetry(() => prisma.payoutMethod.deleteMany({ where: { affiliateId } })).catch(() => {});
  }
  let notifCount = 0;
  if (baselineReady) {
    const notif = await prisma.notification
      .deleteMany({
        where: {
          id: { gt: baselineNotifId },
          OR: [
            { recipientId: { in: affiliateIds.filter(Boolean) } },
            { title: { contains: "Prueba" } },
          ],
        },
      })
      .catch(() => ({ count: 0 }));
    notifCount = notif.count;
  } else {
    console.warn("⚠️ Baseline de notificaciones no capturado: NO se borran notificaciones (protección).");
  }
  const affDel = await prisma.affiliate
    .deleteMany({ where: { email: { in: [EMAIL, EMAIL_BLOCKED] } } })
    .catch(() => ({ count: 0 }));
  console.log(`afiliados eliminados=${affDel.count} · notificaciones=${notifCount}`);
}

async function main() {
  const maxNotif = await withRetry(() => prisma.notification.aggregate({ _max: { id: true } }));
  baselineNotifId = maxNotif._max.id ?? 0;
  baselineReady = true;
  await withRetry(() => prisma.affiliate.deleteMany({ where: { email: { in: [EMAIL, EMAIL_BLOCKED] } } }));

  // 1) Registro real del afiliado temporal en PERÚ
  const reg = await registerAffiliate(EMAIL, NAME, "Perú", "51987654321");
  assert(reg.status === 201, "registro de afiliado temporal (Perú)", `status=${reg.status} ${reg.error || ""}`);
  assert(Boolean(reg.token), "cookie de sesión tras registro", "sin cookie");
  const affiliate = await prisma.affiliate.findUnique({ where: { email: EMAIL } });
  assert(Boolean(affiliate), "afiliado existe en BD", "no encontrado");
  const affHeaders = { "Content-Type": "application/json", Cookie: `affiliate_token=${reg.token}` };

  // 2) YAPE válido con "+51 987 654 321" → 201
  const yapeOk = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "YAPE", accountData: { phone: "+51 987 654 321", holder: "Prueba Yape" } }),
  });
  assert(yapeOk.status === 201, "método YAPE creado (Perú)", `status=${yapeOk.status} ${yapeOk.json?.error || ""}`);
  const method = yapeOk.json?.method;
  assert(method?.type === "YAPE", "tipo guardado es YAPE", String(method?.type));
  assert(method?.currency === "PEN", "moneda guardada es PEN", String(method?.currency));
  assert(method?.accountData?.phone === YAPE_PHONE, "teléfono normalizado a 9 dígitos", String(method?.accountData?.phone));
  assert(method?.accountData?.holder === "Prueba Yape", "titular guardado", String(method?.accountData?.holder));
  assert(method?.isDefault === true, "primer método queda predeterminado", String(method?.isDefault));

  // 3) Negativos: teléfonos inválidos y sin titular
  const notMobile = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "YAPE", accountData: { phone: "123456789", holder: "X" } }),
  });
  assert(notMobile.status === 400, "teléfono que no empieza por 9 rechazado (400)", `status=${notMobile.status}`);
  const tooShort = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "YAPE", accountData: { phone: "98765432", holder: "X" } }),
  });
  assert(tooShort.status === 400, "teléfono de 8 dígitos rechazado (400)", `status=${tooShort.status}`);
  const coPhone = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "YAPE", accountData: { phone: "3001234567", holder: "X" } }),
  });
  assert(coPhone.status === 400, "teléfono colombiano rechazado (400)", `status=${coPhone.status}`);
  const noHolder = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "YAPE", accountData: { phone: YAPE_PHONE, holder: "  " } }),
  });
  assert(noHolder.status === 400, "sin titular rechazado (400)", `status=${noHolder.status}`);

  // 4) Yape es exclusivo de Perú: afiliado de Chile recibe 403
  const blocked = await registerAffiliate(EMAIL_BLOCKED, "Prueba Yape Chile", "Chile", "56912345678");
  assert(blocked.status === 201, "registro de afiliado temporal (Chile)", `status=${blocked.status} ${blocked.error || ""}`);
  const blockedAffiliate = await prisma.affiliate.findUnique({ where: { email: EMAIL_BLOCKED } });
  const blockedYape = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `affiliate_token=${blocked.token}` },
    body: JSON.stringify({ type: "YAPE", accountData: { phone: YAPE_PHONE, holder: "X" } }),
  });
  assert(blockedYape.status === 403, "Yape bloqueado fuera de Perú (403)", `status=${blockedYape.status}`);
  assert(/Perú/.test(blockedYape.json?.error || ""), "el error menciona Perú", blockedYape.json?.error || "");

  // 5) Tolerancia de acentos: país "Peru" (sin tilde) también habilita Yape
  await withRetry(() => prisma.affiliate.update({ where: { id: affiliate.id }, data: { country: "Peru" } }));
  const noAccent = await fetchJson(`${BASE}/api/affiliate/payout-methods`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ type: "YAPE", accountData: { phone: "987111222", holder: "Prueba Yape 2" } }),
  });
  assert(noAccent.status === 201, "país 'Peru' sin tilde también permite Yape (201)", `status=${noAccent.status} ${noAccent.json?.error || ""}`);
  await withRetry(() => prisma.affiliate.update({ where: { id: affiliate.id }, data: { country: "Perú" } }));

  // 6) GET devuelve los métodos Yape
  const methodsRes = await fetchJson(`${BASE}/api/affiliate/payout-methods`, { headers: affHeaders });
  assert(methodsRes.status === 200 && methodsRes.json?.length === 2, "GET métodos devuelve los 2 Yape", `status=${methodsRes.status}, n=${methodsRes.json?.length}`);
  assert(methodsRes.json?.every((m) => m.type === "YAPE"), "GET devuelve solo tipo YAPE", JSON.stringify(methodsRes.json?.map((m) => m.type)));

  // 7) Mínimo de retiro: $10 rechazado ($15 mínimo) — se valida antes del KYC
  const w10 = await fetchJson(`${BASE}/api/affiliate/withdrawals`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ payoutMethodId: method.id, amount: 10 }),
  });
  assert(w10.status === 400 && /retiro mínimo es de \$15/i.test(w10.json?.error || ""), "retiro de $10 rechazado (mínimo $15)", `status=${w10.status} ${w10.json?.error || ""}`);

  // 8) Inyectar KYC aprobado + comisión disponible para probar el retiro de $15
  const doc = await withRetry(() =>
    prisma.affiliateDocument.create({
      data: {
        affiliateId: affiliate.id,
        type: "ID",
        fileName: "prueba-id.png",
        fileData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        status: "APPROVED",
        notes: "Documento de prueba automatizada (E2E Yape).",
      },
    })
  );
  assert(Boolean(doc), "documento KYC aprobado inyectado", "falló");
  const sale = await withRetry(() =>
    prisma.sale.create({
      data: {
        affiliateId: affiliate.id,
        serviceTitle: "Venta de prueba E2E Yape",
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

  // 9) Retiro de $15 aceptado
  const w15 = await fetchJson(`${BASE}/api/affiliate/withdrawals`, {
    method: "POST",
    headers: affHeaders,
    body: JSON.stringify({ payoutMethodId: method.id, amount: 15 }),
  });
  assert(w15.status === 201, "retiro de $15 aceptado", `status=${w15.status} ${w15.json?.error || ""}`);
  assert(w15.json?.withdrawal?.status === "REQUESTED", "retiro queda REQUESTED", String(w15.json?.withdrawal?.status));
  const commissionAfter = await prisma.commission.findUnique({ where: { id: commission.id } });
  assert(commissionAfter.status === "WITHDRAWING", "comisión reservada (WITHDRAWING)", commissionAfter.status);

  // 10) El retiro viaja con el método Yape y el teléfono (lo que ve el admin)
  const wList = await fetchJson(`${BASE}/api/affiliate/withdrawals`, { headers: affHeaders });
  assert(wList.json?.[0]?.payoutMethod?.type === "YAPE", "retiro referencia el método YAPE", String(wList.json?.[0]?.payoutMethod?.type));
  assert(wList.json?.[0]?.payoutMethod?.accountData?.phone === YAPE_PHONE, "el admin vería el teléfono Yape en el retiro", String(wList.json?.[0]?.payoutMethod?.accountData?.phone));

  // 11) Admin: ficha del afiliado y cola de retiros
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
  assert(adminPage.text.includes("Yape (PEN)"), "la ficha admin muestra 'Yape (PEN)'", "texto no encontrado");
  assert(adminPage.text.includes("987 654 321"), "la ficha admin muestra el teléfono Yape formateado", "texto no encontrado");
  const adminWithdrawals = await fetchJson(`${BASE}/admin/withdrawals`, {
    headers: { Cookie: `admin_token=${adminToken}` },
  });
  assert(adminWithdrawals.status === 200, "cola de retiros del admin carga", `status=${adminWithdrawals.status}`);
  assert(adminWithdrawals.text.includes("Pagar en soles"), "la cola muestra «Pagar en soles»", "texto no encontrado");
  assert(adminWithdrawals.text.includes("Yape (PEN)"), "la cola muestra el destino Yape (PEN)", "texto no encontrado");

  // 12) Privacidad: el panel privado muestra las cuentas; la web pública no
  const zelle = await prisma.siteConfig.findUnique({ where: { key: "payments_zelle" } });
  const catalog = await fetchJson(`${BASE}/afiliados/panel/catalogo`, { headers: affHeaders });
  assert(catalog.status === 200, "catálogo del panel carga", `status=${catalog.status}`);
  const publicHome = await fetchJson(`${BASE}/`, {});
  const publicLanding = await fetchJson(`${BASE}/afiliados`, {});
  if (zelle?.value) {
    assert(catalog.text.includes(zelle.value), "el panel privado SÍ muestra la cuenta Zelle", "texto no encontrado");
    assert(!publicHome.text.includes(zelle.value), "el home público NO muestra la cuenta Zelle", "fuga detectada");
    assert(!publicLanding.text.includes(zelle.value), "la landing /afiliados NO muestra la cuenta Zelle", "fuga detectada");
  } else {
    console.warn("⚠️ payments_zelle sin configurar: se omite la comprobación de privacidad.");
  }

  return [affiliate.id, blockedAffiliate?.id];
}

let tempIds = [];
main()
  .then(async (ids) => {
    tempIds = ids;
    console.log("\n────────── RESULTADOS ──────────");
    results.forEach((r) => console.log(r));
    const failed = results.filter((r) => r.startsWith("❌")).length;
    console.log(`\n${failed === 0 ? "🎉 TODOS PASARON" : `⚠️ ${failed} fallaron`}`);
    await cleanup(tempIds);
    await prisma.$disconnect();
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error("\n💥 Error:", error);
    await cleanup(tempIds);
    await prisma.$disconnect();
    process.exit(1);
  });
