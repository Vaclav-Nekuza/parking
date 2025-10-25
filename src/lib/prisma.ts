import { PrismaClient } from "@prisma/client";

// pozn.: kvůli Next.js se při vývoji (HMR) může vytvářet víc instancí Prisma,
// proto si ji uložím do globalThis, aby se použila pořád ta samá
declare global {
	var prisma: PrismaClient | undefined;
}

//tady si jen typuju globalThis, aby TS neházel chyby
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

//když už Prisma existuje, použiju ji, jinak vytvořím novou
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// pozn.: v produkci se to dělat nemusí, ale v dev to uložím do globalThis,
// ať se při každém reloadu netvoří nová instance
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
