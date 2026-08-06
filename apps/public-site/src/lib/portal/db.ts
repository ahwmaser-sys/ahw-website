import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Module-level singleton, cached unconditionally (not just in dev).
// Originally this only cached outside production, on the assumption
// prod only needs it to survive hot-reload — but `next build`'s static
// generation also re-evaluates this module across its worker/route
// passes with NODE_ENV=production, and without caching, each
// evaluation opened a brand-new PrismaPg connection pool that was never
// closed, leaking connections until the local dev database's
// connection handling was exhausted ("Connection terminated
// unexpectedly" across unrelated routes during build). Caching
// unconditionally fixes that in both dev and build, and is exactly as
// safe in a real production server process as it is in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // max: 5 — the local `prisma dev` database is documented upstream as a
  // prototyping tool, not built for heavy concurrent load; Next's build
  // runs several worker processes in parallel, each with its own pool
  // (the singleton above only dedupes *within* one process), and this
  // instance measurably could not sustain the default pool size across
  // many workers' connection churn ("Connection terminated unexpectedly"
  // partway through `next build`, even after fixing the leak above).
  // Capping it is a local-dev mitigation; a real production Postgres
  // with proper pooling doesn't need this tuned the same way.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 5 });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;
