import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function getPrisma(): PrismaClient {
  if (globalThis.__prisma) return globalThis.__prisma;
  globalThis.__prisma = new PrismaClient();
  return globalThis.__prisma;
}

// Proxy que difiere la instanciación de PrismaClient hasta que se
// invoque un método real (como prisma.contact.create(...)).
// Esto evita errores de build en Vercel donde DATABASE_URL no existe
// durante la fase de compilación.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    const client = getPrisma();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
