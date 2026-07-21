// /prisma.config.ts
import "dotenv/config";
import { defineConfig } from 'prisma/config';

// 🛡️ CRITICAL PRISMA 7 BUG WORKAROUND:
// We bypass the broken env() utility entirely. We read directly from process.env 
// and handle empty string wrappers safely to prevent validation failures.
const productionDatabaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: productionDatabaseUrl, 
  },
});
