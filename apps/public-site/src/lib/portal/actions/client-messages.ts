'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireProjectAccess } from '../auth-guard';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const schema = z.object({ projectId: z.string().min(1), body: z.string().trim().min(1, 'Message cannot be empty.') });

// The client-side counterpart to admin's replyToProjectMessage — scoped
// by requireProjectAccess (must be a member of this specific project)
// rather than a staff role check. Writes into the same Message table
// both admin/projects/[id] and C3's API route already read.
export async function sendClientMessage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();

  const parsed = schema.safeParse({ projectId: formData.get('projectId'), body: formData.get('body') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  await requireProjectAccess(principal, parsed.data.projectId);

  const message = await prisma.message.create({
    data: { projectId: parsed.data.projectId, senderId: principal.userId, body: parsed.data.body },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'client.message_sent',
    entityType: 'Message',
    entityId: message.id,
    projectId: parsed.data.projectId,
  });

  revalidatePath(`/client/projects/${parsed.data.projectId}`);
  return { success: 'Message sent.' };
}
