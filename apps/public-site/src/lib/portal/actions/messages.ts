'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const replySchema = z.object({ projectId: z.string().min(1), body: z.string().trim().min(1, 'Message cannot be empty.') });

// Server Actions carry their own same-origin/action-id protection
// (Next.js rejects a cross-origin POST to an action reference before
// this code runs), so this doesn't need the manual verifyCsrf() check
// that /api/portal/projects/[id]/messages uses — that route is a plain
// fetch-based endpoint the C3 verification specifically targeted, this
// is the UI's own form submission path.
export async function replyToProjectMessage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = replySchema.safeParse({ projectId: formData.get('projectId'), body: formData.get('body') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const message = await prisma.message.create({
    data: { projectId: parsed.data.projectId, senderId: principal.userId, body: parsed.data.body },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.message_sent',
    entityType: 'Message',
    entityId: message.id,
    projectId: parsed.data.projectId,
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Reply sent.' };
}

const deleteSchema = z.object({ messageId: z.string().min(1), projectId: z.string().min(1) });

// Hard delete — a Message has no children of its own, so removing an
// accidental or spam message is genuinely safe. Restricted to staff
// (not exposed to clients), same as sending one.
export async function deleteMessage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = deleteSchema.safeParse({ messageId: formData.get('messageId'), projectId: formData.get('projectId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.message.delete({ where: { id: parsed.data.messageId } });
  await recordActivity({ actorId: principal.userId, action: 'admin.message_deleted', entityType: 'Message', entityId: parsed.data.messageId, projectId: parsed.data.projectId });
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Message deleted.' };
}
