import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  // ─── OPTIMIZED: LAZY INITIALIZATION SHIELDS COMPILER FROM SOCKET TIMEOUTS ───
  // We use a proxy handler to intercept calls to Prisma. It will only open the connection 
  // pool when your code actually executes a query (like findUnique) at runtime.
  prismaInstance = new Proxy({} as PrismaClient, {
    get(target, prop, receiver) {
      if (!globalForPrisma.prisma) {
        const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        globalForPrisma.prisma = new PrismaClient({ adapter });
      }
      return Reflect.get(globalForPrisma.prisma, prop, receiver);
    }
  });
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
