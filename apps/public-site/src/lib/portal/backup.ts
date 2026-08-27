import { mkdir, readFile, writeFile, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { put, list, del } from '@vercel/blob';
import { prisma } from './db';

// No pg_dump/pg_restore/psql binary exists in this environment (checked
// directly — none installed), and depending on one existing in whatever
// production host this deploys to is exactly the kind of infrastructure
// assumption this go-live pass is supposed to remove. This is a logical
// (Prisma-level) backup instead: every table's rows, as JSON, restorable
// through the same Prisma connection the app already has — portable to
// any Postgres host, not just ones with the Postgres client tools
// installed alongside the server.
//
// Deliberately excludes Session/PasswordResetToken/EmailVerificationToken
// — restoring old session/reset tokens from a backup would resurrect
// credentials that should stay dead, not preserve real data.
//
// MODEL_ORDER is parents-first (every FK target appears before the rows
// that reference it) so a restore can insert in this order and never hit
// a foreign-key violation. User.invitedById is the one genuine cycle
// (a User can reference another User) — handled with a two-pass insert
// below rather than by breaking the otherwise-clean ordering.
const MODEL_ORDER = [
  'client', 'user', 'enquiry', 'project', 'projectMember', 'milestone', 'projectUpdate',
  'photo', 'document', 'invoice', 'payment', 'notification', 'message',
  'category', 'tag', 'brandKit', 'campaign', 'mediaAsset', 'mediaAssetVariant',
  'mediaAssetUsage', 'mediaCollection', 'mediaCollectionAsset', 'newsPost',
  'newsPostGalleryImage', 'newsPostCategory', 'newsPostTag', 'mediaAssetCategory',
  'mediaAssetTag', 'socialPost', 'landingPage', 'socialTemplate', 'generatedGraphic',
  'generatedGraphicOutput', 'integrationConfig', 'aISettings', 'portalSettings',
  'publishingDestination', 'pageView', 'domainEventOutbox', 'activityLog',
] as const;

type ModelName = (typeof MODEL_ORDER)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic backup/restore genuinely needs to iterate every model dynamically; see MODEL_ORDER above for the one place this app treats Prisma models generically instead of by name.
type AnyDelegate = { findMany: (...args: any[]) => Promise<any[]>; deleteMany: (...args: any[]) => Promise<unknown>; createMany: (args: { data: any[] }) => Promise<unknown> };

function delegate(client: typeof prisma, model: ModelName): AnyDelegate {
  return (client as unknown as Record<ModelName, AnyDelegate>)[model];
}

// Same two-backend choice as storage.ts, and for the exact same reason
// (its comment applies verbatim here): a serverless function's local
// filesystem is ephemeral and reset between invocations, so a backup
// written to local disk in production could vanish — sometimes before
// the very next request that tries to list or restore it. This file
// previously always used local disk regardless of environment; on
// Vercel that meant Create/Restore likely never worked at all, which is
// also almost certainly why this page had no link pointing to it yet.
const BACKUP_ROOT = join(process.cwd(), 'storage', 'backups'); // local-dev fallback only
const BACKUP_PREFIX = 'backups/';
// @vercel/blob authenticates with the classic BLOB_READ_WRITE_TOKEN *or*
// OIDC (VERCEL_OIDC_TOKEN + BLOB_STORE_ID) — confirmed directly in its
// own source (dist/chunk-CIIQSN42.js's credential resolution checks both
// paths). Connecting a store from the dashboard's Storage tab now sets
// up OIDC by default (BLOB_STORE_ID + BLOB_WEBHOOK_PUBLIC_KEY, no
// BLOB_READ_WRITE_TOKEN at all) — checking only the classic token here
// meant a correctly-connected store was still invisible to this file.
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export interface BackupManifest {
  createdAt: string;
  appVersion: string;
  tables: Record<string, number>;
}

export interface BackupFile {
  fileName: string;
  sizeBytes: number;
  createdAt: Date;
}

export function isUsingBlobStorage(): boolean {
  return useBlob;
}

export async function listBackups(): Promise<BackupFile[]> {
  if (useBlob) {
    const { blobs } = await list({ prefix: BACKUP_PREFIX });
    return blobs
      .filter((b) => b.pathname.endsWith('.json'))
      .map((b) => ({ fileName: b.pathname.slice(BACKUP_PREFIX.length), sizeBytes: b.size, createdAt: b.uploadedAt }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  await mkdir(BACKUP_ROOT, { recursive: true });
  const files = await readdir(BACKUP_ROOT);
  const backups = await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (fileName) => {
        const stats = await stat(join(BACKUP_ROOT, fileName));
        return { fileName, sizeBytes: stats.size, createdAt: stats.mtime };
      })
  );
  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createBackup(): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {};
  for (const model of MODEL_ORDER) {
    data[model] = await delegate(prisma, model).findMany();
  }

  const manifest: BackupManifest = {
    createdAt: new Date().toISOString(),
    appVersion: '1.0.0-go-live',
    tables: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
  };

  const fileName = `backup-${manifest.createdAt.replace(/[:.]/g, '-')}.json`;
  const json = JSON.stringify({ manifest, data }, null, 0);

  if (useBlob) {
    await put(`${BACKUP_PREFIX}${fileName}`, json, { access: 'public', addRandomSuffix: false, contentType: 'application/json' });
    return { fileName, sizeBytes: Buffer.byteLength(json), createdAt: new Date() };
  }
  await mkdir(BACKUP_ROOT, { recursive: true });
  const filePath = join(BACKUP_ROOT, fileName);
  await writeFile(filePath, json);
  const stats = await stat(filePath);
  return { fileName, sizeBytes: stats.size, createdAt: stats.mtime };
}

// Backups have no database row of their own (see MODEL_ORDER's comment —
// they live entirely in the store), so unlike storage.ts's saveFile
// there's no column to persist Blob's real URL in. Resolved by exact
// pathname match on every read/delete instead — fileName always comes
// from this app's own listBackups()/createBackup(), never a client-
// supplied path (see resolveBackupPath's same defense-in-depth note).
async function resolveBackupBlobUrl(fileName: string): Promise<string> {
  const pathname = `${BACKUP_PREFIX}${fileName}`;
  const { blobs } = await list({ prefix: pathname });
  const match = blobs.find((b) => b.pathname === pathname);
  if (!match) {
    throw new Error(`Backup "${fileName}" was not found.`);
  }
  return match.url;
}

export interface BackupValidation {
  ok: boolean;
  error?: string;
  manifest?: BackupManifest;
}

export async function validateBackup(fileName: string): Promise<BackupValidation> {
  try {
    const raw = await readBackupJson(fileName);
    const parsed = JSON.parse(raw) as { manifest?: BackupManifest; data?: Record<string, unknown[]> };
    if (!parsed.manifest || !parsed.data) {
      return { ok: false, error: 'Missing manifest or data section.' };
    }
    for (const model of MODEL_ORDER) {
      if (!Array.isArray(parsed.data[model])) {
        return { ok: false, error: `Missing or malformed table: ${model}.` };
      }
    }
    return { ok: true, manifest: parsed.manifest };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not read backup file.' };
  }
}

function resolveBackupPath(fileName: string): string {
  // Defense in depth against a path-traversal filename, same posture as
  // storage.ts's resolveKey — fileName always comes from a value this
  // app itself generated (createBackup) or listed (listBackups), never
  // directly from an untrusted client-supplied path.
  if (fileName.includes('/') || fileName.includes('..')) {
    throw new Error('Invalid backup file name.');
  }
  return join(BACKUP_ROOT, fileName);
}

// Centralizes the read so validateBackup/restoreBackup/readBackupFile
// don't each re-implement the Blob-vs-local branch.
async function readBackupJson(fileName: string): Promise<string> {
  if (useBlob) {
    const url = await resolveBackupBlobUrl(fileName);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Blob storage read failed for "${fileName}": ${res.status} ${res.statusText}`);
    }
    return res.text();
  }
  return readFile(resolveBackupPath(fileName), 'utf8');
}

export async function readBackupFile(fileName: string): Promise<Buffer> {
  if (useBlob) {
    const url = await resolveBackupBlobUrl(fileName);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Blob storage read failed for "${fileName}": ${res.status} ${res.statusText}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(resolveBackupPath(fileName));
}

// Gated to SUPER_ADMIN in the action layer, same as every other backup
// operation — deletes the stored file only, no database rows to clean
// up (backups aren't tracked in a table, see MODEL_ORDER's comment).
export async function deleteBackup(fileName: string): Promise<void> {
  if (useBlob) {
    const url = await resolveBackupBlobUrl(fileName);
    await del(url);
    return;
  }
  await unlink(resolveBackupPath(fileName));
}

// Restores every table from the backup in one transaction — if anything
// fails partway (a stale backup from before a schema migration, a
// malformed row), Postgres rolls the whole thing back and the live
// database is untouched. Deletes in reverse of MODEL_ORDER (children
// before parents), then inserts in MODEL_ORDER (parents before
// children) — the same ordering that makes createBackup's tables
// FK-safe applies symmetrically here.
export async function restoreBackup(fileName: string): Promise<void> {
  const validation = await validateBackup(fileName);
  if (!validation.ok) {
    throw new Error(`Refusing to restore an invalid backup: ${validation.error}`);
  }
  const raw = await readBackupJson(fileName);
  const parsed = JSON.parse(raw) as { data: Record<string, Record<string, unknown>[]> };

  await prisma.$transaction(
    async (tx) => {
      for (const model of [...MODEL_ORDER].reverse()) {
        await delegate(tx as unknown as typeof prisma, model).deleteMany();
      }
      for (const model of MODEL_ORDER) {
        const rows = parsed.data[model] ?? [];
        if (rows.length === 0) continue;
        if (model === 'user') {
          // Break the self-referential invitedById cycle: insert every
          // user with it nulled out, then patch the real values back in
          // a second pass once every row (and therefore every valid FK
          // target) exists.
          const withInvites = rows.filter((r) => r['invitedById']);
          await delegate(tx as unknown as typeof prisma, model).createMany({
            data: rows.map((r) => ({ ...r, invitedById: null })),
          });
          for (const r of withInvites) {
            await tx.user.update({ where: { id: r['id'] as string }, data: { invitedById: r['invitedById'] as string } });
          }
          continue;
        }
        await delegate(tx as unknown as typeof prisma, model).createMany({ data: rows });
      }
    },
    { timeout: 60_000 }
  );
}
