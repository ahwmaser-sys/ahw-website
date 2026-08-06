import { prisma } from './db';

// Postgres-backed sliding-window rate limiter — swapped from an
// in-memory Map because a serverless deployment (Vercel) can run each
// request in a different, memory-isolated container instance, which
// would silently defeat an in-memory limiter (a brute-force attempt
// simply lands on a fresh container with an empty Map). One row per
// attempt rather than one row per key with a rolling array, so
// concurrent requests hitting the same key are a plain insert/count,
// never a read-modify-write race.
export async function isRateLimited(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs);

  const count = await prisma.rateLimitAttempt.count({
    where: { key, createdAt: { gt: windowStart } },
  });

  if (count >= maxAttempts) {
    return true;
  }

  await prisma.$transaction([
    prisma.rateLimitAttempt.create({ data: { key } }),
    // Opportunistic cleanup scoped to this key only — keeps the table
    // from growing unbounded without needing a separate cron job.
    prisma.rateLimitAttempt.deleteMany({ where: { key, createdAt: { lte: windowStart } } }),
  ]);

  return false;
}
