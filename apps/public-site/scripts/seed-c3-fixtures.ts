// One-off fixture script for C3 security verification — NOT part of the
// app runtime. Creates two clients, each with one user, one project, and
// one document, so cross-client access denial can be genuinely attempted
// (not just reasoned about from reading the guard code). Safe to re-run
// (upserts by email/id-derived keys). Deleted or left as a dev fixture —
// never referenced by production code paths.
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
import argon2 from 'argon2';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await argon2.hash('TestClient!12345', { type: argon2.argon2id });

  const clientA = await prisma.client.upsert({
    where: { id: 'c3-fixture-client-a' },
    update: {},
    create: { id: 'c3-fixture-client-a', companyName: 'Fixture Client A LLC', officeId: 'office-kuwait-hq' },
  });
  const clientB = await prisma.client.upsert({
    where: { id: 'c3-fixture-client-b' },
    update: {},
    create: { id: 'c3-fixture-client-b', companyName: 'Fixture Client B LLC', officeId: 'office-egypt' },
  });

  const userA = await prisma.user.upsert({
    where: { email: 'client-a@fixture.test' },
    update: {},
    create: {
      email: 'client-a@fixture.test',
      passwordHash,
      role: 'CLIENT',
      name: 'Client A Test User',
      clientId: clientA.id,
      emailVerifiedAt: new Date(),
    },
  });
  const userB = await prisma.user.upsert({
    where: { email: 'client-b@fixture.test' },
    update: {},
    create: {
      email: 'client-b@fixture.test',
      passwordHash,
      role: 'CLIENT',
      name: 'Client B Test User',
      clientId: clientB.id,
      emailVerifiedAt: new Date(),
    },
  });

  const projectA = await prisma.project.upsert({
    where: { id: 'c3-fixture-project-a' },
    update: {},
    create: { id: 'c3-fixture-project-a', name: 'Fixture Project A', description: 'C3 verification fixture', officeId: 'office-kuwait-hq' },
  });
  const projectB = await prisma.project.upsert({
    where: { id: 'c3-fixture-project-b' },
    update: {},
    create: { id: 'c3-fixture-project-b', name: 'Fixture Project B', description: 'C3 verification fixture', officeId: 'office-egypt' },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: projectA.id, userId: userA.id } },
    update: {},
    create: { projectId: projectA.id, userId: userA.id },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: projectB.id, userId: userB.id } },
    update: {},
    create: { projectId: projectB.id, userId: userB.id },
  });

  // Real file on disk for Project A's document, so the download path is
  // genuinely exercised (not just a DB row with no backing bytes).
  const storageDir = join(process.cwd(), 'storage', 'portal', 'c3-fixture-project-a');
  await mkdir(storageDir, { recursive: true });
  const storageKey = 'c3-fixture-project-a/contract.txt';
  await writeFile(join(process.cwd(), 'storage', 'portal', storageKey), 'Fixture contract contents for Project A — confidential.\n');

  const existingDoc = await prisma.document.findFirst({ where: { projectId: projectA.id, storageKey } });
  const document = existingDoc
    ? existingDoc
    : await prisma.document.create({
        data: {
          projectId: projectA.id,
          storageKey,
          fileName: 'contract.txt',
          fileType: 'text/plain',
          fileSize: 57,
          category: 'CONTRACT',
          uploadedById: userA.id,
        },
      });

  console.log(JSON.stringify({ userA: userA.id, userB: userB.id, projectA: projectA.id, projectB: projectB.id, document: document.id }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
