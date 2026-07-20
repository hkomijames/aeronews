import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lazy initializer utility function
function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Create the pooling connection client channel
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    // Forces the underlying pg driver to close idle connections quickly to protect Neon costs
    idleTimeoutMillis: 10000, 
    max: 1 // Pairs beautifully with Vercel serverless architectures
  });
  
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  
  return client;
}

// ─── SHIELDED LAZY INTERFACE EXPORT ───
// This pattern exposes the schema client cleanly, executing the query setup 
// exclusively at the moment your backend calls a table execution rule.
export const prisma = {
  get user() { return createPrismaClient().user; },
  get article() { return createPrismaClient().article; },
  get $disconnect() { return createPrismaClient().$disconnect; },
  get $connect() { return createPrismaClient().$connect; },
  get $transaction() { return createPrismaClient().$transaction; },
  get $executeRaw() { return createPrismaClient().$executeRaw; },
  get $queryRaw() { return createPrismaClient().$queryRaw; },
} as unknown as PrismaClient;
