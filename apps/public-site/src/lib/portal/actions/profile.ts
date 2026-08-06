'use server';

import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../auth-guard';
import { SESSION_COOKIE } from '../session';
import { prisma } from '../db';
import { hashPassword, verifyPassword } from '../password';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: z.string().min(10, 'New password must be at least 10 characters.'),
});

// Self-service change, distinct from admin's resetClientPassword — this
// one requires proving the *current* password, not just staff role.
export async function changeOwnPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const user = await prisma.user.findUnique({ where: { id: principal.userId } });
  if (!user) {
    return { error: 'Account not found.' };
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
  if (!valid) {
    return { error: 'Current password is incorrect.' };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  // Keep the current session alive (the user is right here, mid-flow)
  // but invalidate every other session — same "changing a password
  // signs out elsewhere" principle as the admin-triggered reset.
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value;
  const currentTokenHash = currentToken ? createHash('sha256').update(currentToken).digest('hex') : null;

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({
      where: { userId: user.id, ...(currentTokenHash ? { NOT: { tokenHash: currentTokenHash } } : {}) },
    }),
  ]);

  await recordActivity({ actorId: user.id, actorEmail: user.email, action: 'auth.password_changed_self' });

  // Both call sites (client Profile, admin Security) share this one
  // action — revalidating a path the caller isn't on is a harmless no-op.
  revalidatePath('/client/profile');
  revalidatePath('/admin/settings/security');
  return { success: 'Password changed. You have been signed out on any other device.' };
}

export async function markNotificationRead(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();

  const notificationId = formData.get('notificationId');
  if (typeof notificationId !== 'string' || !notificationId) {
    return { error: 'Invalid request.' };
  }

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== principal.userId) {
    // Same shape whether it doesn't exist or belongs to someone else —
    // never confirm another user's notification IDs are valid.
    return { error: 'Not found.' };
  }

  await prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });

  revalidatePath('/client/notifications');
  revalidatePath('/client');
  return { success: 'Marked as read.' };
}
