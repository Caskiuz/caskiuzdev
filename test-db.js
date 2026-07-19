const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  try {
    await p.$connect();
    console.log("CONECTADO OK");
    const count = await p.contact.count();
    console.log("Contactos:", count);
  } catch (e) {
    console.error("ERROR:", e.message);
  } finally {
    await p.$disconnect();
  }
}

main();