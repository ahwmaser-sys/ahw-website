'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const schema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required.'),
  body: z.string().trim().min(1, 'Message is required.'),
});

// Sends a direct notification to every client-side member of a
// project — distinct from postProjectUpdate's automatic notification,
// for things that aren't a full project update (a reminder, a request
// for a document, etc).
export async function sendProjectNotification(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = schema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId: parsed.data.projectId, userId: { not: null } },
  });

  if (members.length === 0) {
    return { error: 'No client is assigned to this project yet.' };
  }

  await prisma.notification.createMany({
    data: members
      .filter((m) => m.userId)
      .map((m) => ({ userId: m.userId as string, title: parsed.data.title, body: parsed.data.body })),
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.notification_sent',
    projectId: parsed.data.projectId,
    metadata: { title: parsed.data.title, recipientCount: members.length },
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: `Notification sent to ${members.length} client${members.length === 1 ? '' : 's'}.` };
}
