'use server';

import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

// A genuine incident-response action: every session, everywhere
// (including the SUPER_ADMIN clicking this), is invalidated at once.
// Reuses the exact mechanism per-user disable/password-reset already use
// (deleting Session rows — session.ts checks for a matching row on
// every request), just applied to all of them instead of one.
export async function forceLogoutEverywhere(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const { count } = await prisma.session.deleteMany();

  await recordActivity({ actorId: principal.userId, action: 'admin.force_logout_all', metadata: { sessionsRevoked: count } });
  revalidatePath('/admin/settings/security');
  return { success: `${count} session(s) revoked — everyone, including you, will need to sign in again.` };
}
