import { Prisma } from '@prisma/client';
import type { IntegrationConfig, IntegrationType } from '@prisma/client';
import { prisma } from '../db';
import { encryptJson, decryptJson } from './encryption';

// The one place every adapter (social, AI, analytics, email, maps) reads
// its credential from, and the one place Settings → Integrations writes
// to. Nothing outside this module ever touches credentialCiphertext
// directly — callers only ever see decrypted, typed payloads or `null`.
//
// officeId scopes the four social platform types (each office connects
// its own Instagram/Facebook/LinkedIn/Google Business) — every function
// takes it as an optional parameter, always normalized to `null` for
// company-wide integrations (AI providers, GA4/GSC, Maps, Email).
//
// Reads use findFirst rather than the type_officeId compound-unique
// shorthand: Prisma's query engine rejects `officeId: null` there
// ("Argument officeId must not be null") even though the column is
// nullable and a plain filter accepts null correctly — findFirst still
// returns a single row because [type, officeId] is DB-unique. Writes
// (upsertIntegrationConfig below) hit the same restriction, so they do
// the find-then-create/update manually instead of Prisma's upsert.

// Same round-trip trick as brand-kit.ts's toJsonValue — satisfies
// Prisma's InputJsonValue structurally rather than an unsafe cast.
function toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function officeKey(officeId?: string | null): string | null {
  return officeId ?? null;
}

// Prisma's upsert() requires a WhereUniqueInput, and the compound
// type_officeId shorthand rejects null — so this does the equivalent
// manually. The create/create-race is closed by catching the unique
// constraint violation (P2002) a concurrent request can cause and
// falling back to update, rather than assuming single-writer.
async function upsertIntegrationConfig(
  type: IntegrationType,
  officeId: string | null,
  create: Omit<Prisma.IntegrationConfigUncheckedCreateInput, 'type' | 'officeId'>,
  update: Prisma.IntegrationConfigUncheckedUpdateInput
): Promise<IntegrationConfig> {
  const existing = await prisma.integrationConfig.findFirst({ where: { type, officeId } });
  if (existing) {
    return prisma.integrationConfig.update({ where: { id: existing.id }, data: update });
  }
  try {
    return await prisma.integrationConfig.create({ data: { type, officeId, ...create } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const row = await prisma.integrationConfig.findFirstOrThrow({ where: { type, officeId } });
      return prisma.integrationConfig.update({ where: { id: row.id }, data: update });
    }
    throw error;
  }
}

export async function getIntegrationCredential<T>(type: IntegrationType, officeId?: string | null): Promise<T | null> {
  const row = await prisma.integrationConfig.findFirst({ where: { type, officeId: officeKey(officeId) } });
  if (!row?.credentialCiphertext) return null;
  try {
    return decryptJson<T>(row.credentialCiphertext);
  } catch {
    // Ciphertext that fails to decrypt (e.g. INTEGRATION_ENCRYPTION_KEY
    // rotated without a re-connect) is treated the same as "not
    // connected" — never thrown into a caller expecting a credential.
    return null;
  }
}

export async function getIntegrationStatus(type: IntegrationType, officeId?: string | null): Promise<IntegrationConfig | null> {
  return prisma.integrationConfig.findFirst({ where: { type, officeId: officeKey(officeId) } });
}

// listIntegrationStatuses optionally scoped to one office (the
// Integrations page's per-office cards) or, with no argument, every row
// (System Health's cross-office rollups).
export async function listIntegrationStatuses(officeId?: string | null): Promise<IntegrationConfig[]> {
  return prisma.integrationConfig.findMany({
    where: officeId === undefined ? {} : { officeId: officeKey(officeId) },
    orderBy: { type: 'asc' },
  });
}

export async function connectIntegration(
  type: IntegrationType,
  credential: unknown,
  options: { metadata?: Record<string, unknown>; connectedById?: string; officeId?: string | null; scopes?: string[] } = {}
): Promise<void> {
  const officeId = officeKey(options.officeId);
  await upsertIntegrationConfig(
    type,
    officeId,
    {
      status: 'CONNECTED',
      credentialCiphertext: encryptJson(credential),
      metadata: toJsonValue(options.metadata ?? {}),
      scopes: options.scopes ?? [],
      connectedAt: new Date(),
      connectedById: options.connectedById ?? null,
      lastTokenRefreshAt: new Date(),
    },
    {
      status: 'CONNECTED',
      credentialCiphertext: encryptJson(credential),
      metadata: toJsonValue(options.metadata ?? {}),
      scopes: options.scopes ?? [],
      connectedAt: new Date(),
      connectedById: options.connectedById ?? null,
      lastTokenRefreshAt: new Date(),
      lastError: null,
    }
  );
}

export async function disconnectIntegration(type: IntegrationType, officeId?: string | null): Promise<void> {
  const office = officeKey(officeId);
  await upsertIntegrationConfig(
    type,
    office,
    { status: 'NOT_CONNECTED' },
    {
      status: 'NOT_CONNECTED',
      credentialCiphertext: null,
      metadata: {},
      scopes: [],
      connectedAt: null,
      connectedById: null,
      lastError: null,
      lastTokenRefreshAt: null,
    }
  );
}

export async function recordIntegrationTest(
  type: IntegrationType,
  result: { ok: boolean; error?: string; metadata?: Record<string, unknown> },
  officeId?: string | null
): Promise<void> {
  const office = officeKey(officeId);
  const now = new Date();
  await upsertIntegrationConfig(
    type,
    office,
    {
      status: result.ok ? 'CONNECTED' : 'ERROR',
      lastTestedAt: now,
      lastSuccessAt: result.ok ? now : null,
      lastError: result.ok ? null : (result.error ?? 'Test failed.'),
      metadata: toJsonValue(result.metadata ?? {}),
    },
    {
      status: result.ok ? 'CONNECTED' : 'ERROR',
      lastTestedAt: now,
      ...(result.ok ? { lastSuccessAt: now, lastError: null } : { lastError: result.error ?? 'Test failed.' }),
      ...(result.metadata ? { metadata: toJsonValue(result.metadata) } : {}),
    }
  );
}

// Called by social dispatch after every publish attempt — the "Last
// publish" / "Last error" fields Settings → Integrations shows are real,
// updated at the moment a post actually goes out, not just at connect
// time.
export async function recordIntegrationPublish(type: IntegrationType, officeId: string, result: { ok: boolean; error?: string }): Promise<void> {
  await prisma.integrationConfig.updateMany({
    where: { type, officeId },
    data: {
      lastPublishAt: new Date(),
      lastPublishError: result.ok ? null : (result.error ?? 'Publish failed.'),
    },
  });
}
