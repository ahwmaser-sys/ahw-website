'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { recordActivity } from '../audit';
import { createBackup, restoreBackup, validateBackup, deleteBackup } from '../backup';
import type { ActionState } from '../../../components/portal/ActionForm';

export async function createBackupAction(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  let backup;
  try {
    backup = await createBackup();
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not write the backup — is a storage backend connected?' };
  }
  await recordActivity({ actorId: principal.userId, action: 'admin.backup_created', metadata: { fileName: backup.fileName, sizeBytes: backup.sizeBytes } });
  revalidatePath('/admin/settings/backup');
  return { success: `Backup created: ${backup.fileName} (${(backup.sizeBytes / 1024).toFixed(0)} KB).` };
}

const fileSchema = z.object({ fileName: z.string().trim().min(1) });

export async function validateBackupAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = fileSchema.safeParse({ fileName: formData.get('fileName') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const result = await validateBackup(parsed.data.fileName);
  return result.ok
    ? { success: `Valid — ${Object.values(result.manifest?.tables ?? {}).reduce((a, b) => a + b, 0)} rows across ${Object.keys(result.manifest?.tables ?? {}).length} tables.` }
    : { error: `Invalid backup: ${result.error}` };
}

// Restoring is the one genuinely destructive operation in this entire
// admin panel — every current row in every backed-up table is replaced.
// Gated to SUPER_ADMIN, requires the exact confirmation phrase (checked
// here, not just client-side), and the whole thing runs inside one
// database transaction (see backup.ts) so a failure midway rolls back
// completely rather than leaving a half-restored database.
const restoreSchema = z.object({ fileName: z.string().trim().min(1), confirmation: z.literal('RESTORE') });

export async function restoreBackupAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = restoreSchema.safeParse({ fileName: formData.get('fileName'), confirmation: formData.get('confirmation') });
  if (!parsed.success) {
    return { error: 'Type RESTORE exactly to confirm.' };
  }

  try {
    await restoreBackup(parsed.data.fileName);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Restore failed — the database was not changed (transaction rolled back).' };
  }

  await recordActivity({ actorId: principal.userId, action: 'admin.backup_restored', metadata: { fileName: parsed.data.fileName } });
  revalidatePath('/admin');
  return { success: `Restored from ${parsed.data.fileName}.` };
}

export async function deleteBackupAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = fileSchema.safeParse({ fileName: formData.get('fileName') });
  if (!parsed.success) return { error: 'Invalid request.' };

  try {
    await deleteBackup(parsed.data.fileName);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not delete that backup.' };
  }
  await recordActivity({ actorId: principal.userId, action: 'admin.backup_deleted', metadata: { fileName: parsed.data.fileName } });
  revalidatePath('/admin/settings/backup');
  return { success: `Deleted ${parsed.data.fileName}.` };
}
