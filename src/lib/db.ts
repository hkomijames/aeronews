import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient;
  pool?: pg.Pool;
};

function getOrCreatePrismaClient(): PrismaClient {
  // 1. Instantly return the cached instance if it already exists (Crucial on production!)
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // 2. Set up your optimized, tight pooling engine
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL, 
    idleTimeoutMillis: 5000, // Reduced to 5 seconds to drop connections even faster
    max: 1 // Strictly caps the socket limit per serverless context
  });
  
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  
  // 3. PERSIST THE INSTANCE UNIVERSALLY (Fixes the production memory leak)
  globalForPrisma.pool = pool;
  globalForPrisma.prisma = client;
  
  return client;
}

// ─── SHIELDED UNIVERSAL LAZY INTERFACE EXPORT ───
export const prisma = {
  get user() { return getOrCreatePrismaClient().user; },
  get article() { return getOrCreatePrismaClient().article; },
  get $disconnect() { return getOrCreatePrismaClient().$disconnect; },
  get $connect() { return getOrCreatePrismaClient().$connect; },
  get $transaction() { return getOrCreatePrismaClient().$transaction; },
  get $executeRaw() { return getOrCreatePrismaClient().$executeRaw; },
  get $queryRaw() { return getOrCreatePrismaClient().$queryRaw; },
} as unknown as PrismaClient;
