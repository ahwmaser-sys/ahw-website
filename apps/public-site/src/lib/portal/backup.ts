import { mkdir, readFile, writeFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
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

const BACKUP_ROOT = join(process.cwd(), 'storage', 'backups');

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

export async function listBackups(): Promise<BackupFile[]> {
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
  await mkdir(BACKUP_ROOT, { recursive: true });

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
  const filePath = join(BACKUP_ROOT, fileName);
  await writeFile(filePath, JSON.stringify({ manifest, data }, null, 0));

  const stats = await stat(filePath);
  return { fileName, sizeBytes: stats.size, createdAt: stats.mtime };
}

export interface BackupValidation {
  ok: boolean;
  error?: string;
  manifest?: BackupManifest;
}

export async function validateBackup(fileName: string): Promise<BackupValidation> {
  try {
    const raw = await readFile(resolveBackupPath(fileName), 'utf8');
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

export function readBackupFile(fileName: string): Promise<Buffer> {
  return readFile(resolveBackupPath(fileName));
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
  const raw = await readFile(resolveBackupPath(fileName), 'utf8');
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
