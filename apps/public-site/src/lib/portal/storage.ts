import { mkdir, readFile, writeFile, unlink } from 'fs/promises';
import { dirname, join, normalize } from 'path';
import { put, del } from '@vercel/blob';

// Shaped like packages/application's ObjectStoragePort — see
// /PORTAL-PLAN.md §6/§9.
//
// Two backends, chosen automatically by whether BLOB_READ_WRITE_TOKEN is
// set (Vercel provisions this env var automatically once a Blob store is
// connected to the project — see the deployment guide):
//
//   - Local filesystem — used in local dev (no token). Never viable in
//     production on Vercel: serverless function filesystems are
//     ephemeral and reset between invocations, so anything written here
//     would vanish, sometimes before the very next request reads it back.
//   - Vercel Blob — used in production. `saveFile` returns the *real*
//     key every caller must persist as `storageKey` (a full https URL
//     in Blob mode, the same relative path as before in local mode) —
//     callers must use that return value, not re-derive their own key,
//     since only Blob's own `put()` response reveals the real URL.
//
// Every caller goes through saveFile/readFileByKey/deleteFile — this is
// the one file a real storage swap touches.
const STORAGE_ROOT = join(process.cwd(), 'storage', 'portal');
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function resolveLocalPath(key: string): string {
  const filePath = normalize(join(STORAGE_ROOT, key));
  if (!filePath.startsWith(STORAGE_ROOT)) {
    // storageKey is written by our own upload code, never taken from a
    // client-supplied path — this is a defense-in-depth check, not the
    // primary access control (that's requireProjectAccess + signed URLs).
    throw new Error('Invalid storage key.');
  }
  return filePath;
}

// Returns the key to persist as storageKey — in Blob mode this is NOT
// the same string that was passed in (Blob's real, fetchable URL),
// which is why every caller uses this return value rather than its own
// pre-built key.
export async function saveFile(key: string, data: Buffer): Promise<string> {
  if (useBlob) {
    const blob = await put(key, data, { access: 'public', addRandomSuffix: false, allowOverwrite: true });
    return blob.url;
  }
  const filePath = resolveLocalPath(key);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
  return key;
}

// `key` is whatever saveFile previously returned — a full URL in Blob
// mode, a relative path in local mode. Never re-derived, just read back
// from wherever the caller stored it (a Prisma storageKey column).
export async function readFileByKey(key: string): Promise<Buffer> {
  if (useBlob) {
    const res = await fetch(key);
    if (!res.ok) {
      throw new Error(`Blob storage read failed for "${key}": ${res.status} ${res.statusText}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(resolveLocalPath(key));
}

export async function deleteFile(key: string): Promise<void> {
  if (useBlob) {
    await del(key).catch(() => {
      // Already gone — same "don't block the DB cleanup" reasoning as
      // the local-mode branch below.
    });
    return;
  }
  await unlink(resolveLocalPath(key)).catch(() => {
    // Already gone — deleting a MediaAsset whose file was already removed
    // (or never fully written) shouldn't block the database row from
    // being cleaned up.
  });
}

// Local-mode-only: exposes the real filesystem path for tools that need
// one directly (ffprobe in lib/portal/media/pipeline.ts). Not meaningful
// in Blob mode — nothing calls this when useBlob is true; video metadata
// extraction downloads to a real OS temp file itself instead (see
// pipeline.ts), independent of which storage backend is active.
export function resolveFilePath(key: string): string {
  return resolveLocalPath(key);
}

export function isUsingBlobStorage(): boolean {
  return useBlob;
}
