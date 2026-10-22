/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Crea/actualiza las cuentas de administración del panel.
 *
 * - Caskiuz   → rol GLOBAL (web + red de afiliados)
 * - Esmeralda → rol AFFILIATES (solo red de afiliados)
 *
 * Las claves se leen del .env (ADMIN_PASSWORD y ADMIN2_PASSWORD) y nunca se
 * imprimen. Es idempotente: volver a ejecutarlo resetea la clave al valor
 * actual del .env y reactiva la cuenta.
 *
 * Uso: node scripts/seed-admins.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { randomBytes, scryptSync } = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** Mismo formato que src/lib/password.ts (scrypt$<salt_hex>$<hash_hex>). */
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const admins = [
    {
      username: process.env.ADMIN_USERNAME || "Caskiuz",
      name: "Ricardo (Caskiuz)",
      role: "GLOBAL",
      password: process.env.ADMIN_PASSWORD,
    },
    {
      username: process.env.ADMIN2_USERNAME || "Esmeralda",
      name: "Esmeralda",
      role: "AFFILIATES",
      password: process.env.ADMIN2_PASSWORD,
    },
  ];

  const synced = [];
  for (const admin of admins) {
    if (!admin.password) {
      console.log(`⚠️  ${admin.username}: falta la clave en el .env, se omite.`);
      continue;
    }

    const data = {
      username: admin.username,
      passwordHash: hashPassword(admin.password),
      name: admin.name,
      role: admin.role,
      active: true,
    };

    const user = await prisma.adminUser.upsert({
      where: { username: admin.username },
      update: data,
      create: data,
    });

    synced.push({ id: user.id, username: user.username, role: user.role });
    console.log(`✅ ${user.username} → rol ${user.role} (id ${user.id})`);
  }

  // Las notificaciones históricas del admin (recipientId null) pasan al GLOBAL
  const globalAdmin = synced.find((a) => a.role === "GLOBAL");
  if (globalAdmin) {
    const backfilled = await prisma.notification.updateMany({
      where: { recipientType: "ADMIN", recipientId: null },
      data: { recipientId: globalAdmin.id },
    });
    console.log(`🔔 notificaciones históricas asignadas a ${globalAdmin.username}: ${backfilled.count}`);
  }

  const total = await prisma.adminUser.count({ where: { active: true } });
  console.log(`Admins activos: ${total} · ${synced.map((a) => a.username).join(", ")}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
