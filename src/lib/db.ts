import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // ⚡ Cost-Optimized Serverless Pool Engine Configuration
  const pool = new pg.Pool({ 
    // Passes your transaction pooler URL explicitly into the node-pg driver adapter
    connectionString: process.env.DATABASE_URL, 
    idleTimeoutMillis: 10000, // Drops idle cloud connections quickly to keep Neon billing low
    max: 1 // Restricts each serverless container thread to one dedicated socket channel
  });
  
  const adapter = new PrismaPg(pool);
  
  // Clean initialization fully compliant with Prisma 7 strict TypeScript signatures
  const client = new PrismaClient({ adapter });
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  
  return client;
}

// ─── SHIELDED LAZY INTERFACE EXPORT ───
export const prisma = {
  get user() { return createPrismaClient().user; },
  get article() { return createPrismaClient().article; },
  get $disconnect() { return createPrismaClient().$disconnect; },
  get $connect() { return createPrismaClient().$connect; },
  get $transaction() { return createPrismaClient().$transaction; },
  get $executeRaw() { return createPrismaClient().$executeRaw; },
  get $queryRaw() { return createPrismaClient().$queryRaw; },
} as unknown as PrismaClient;
