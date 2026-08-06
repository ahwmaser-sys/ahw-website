import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
import argon2 from 'argon2';

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Seeds exactly one SUPER_ADMIN account from environment variables — never
// hardcoded credentials in source, per the brief's explicit C1 requirement.
// Seeds nothing else: no demo clients/projects, since this same seed
// script could plausibly run against a real database later.
async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set (see apps/public-site/.env) before seeding.'
    );
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Seeded SUPER_ADMIN: ${user.email} (${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
