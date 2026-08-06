'use server';

import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { hashPassword } from '../password';
import { sendEmail, passwordResetEmail } from '../email';
import { recordActivity } from '../audit';
import { getSiteUrl } from '../../site-config';
import type { ActionState } from '../../../components/portal/ActionForm';

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour, same as the self-service forgot-password flow

const inviteSchema = z.object({
  email: z.string().trim().email('Enter a valid email.'),
  name: z.string().trim().min(1, 'Name is required.'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']),
});

// Creates the account with a random, never-shared password (the account
// is unusable until the invitee resets it), then sends the exact same
// reset-password email/token flow forgot-password already uses — no
// second invite mechanism to keep in sync with the first.
export async function inviteStaffUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    role: formData.get('role'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: 'A user with this email already exists.' };
  }

  const randomPassword = randomBytes(32).toString('hex');
  const passwordHash = await hashPassword(randomPassword);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash,
      invitedById: principal.userId,
    },
  });

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TTL_MS) } });

  const siteUrl = await getSiteUrl();
  await sendEmail({ to: user.email, ...passwordResetEmail(`${siteUrl}/admin/reset-password/${token}`) });

  await recordActivity({ actorId: principal.userId, action: 'admin.staff_invited', entityType: 'User', entityId: user.id, metadata: { role: parsed.data.role } });
  revalidatePath('/admin/settings/users');
  return { success: `Invited ${parsed.data.email} as ${parsed.data.role} — they'll receive a password-setup email.` };
}

const statusSchema = z.object({ userId: z.string().min(1), status: z.enum(['ACTIVE', 'DISABLED']) });

export async function setStaffUserStatus(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = statusSchema.safeParse({ userId: formData.get('userId'), status: formData.get('status') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }
  if (parsed.data.userId === principal.userId) {
    return { error: "You can't disable your own account." };
  }

  await prisma.user.update({ where: { id: parsed.data.userId }, data: { status: parsed.data.status } });
  if (parsed.data.status === 'DISABLED') {
    await prisma.session.deleteMany({ where: { userId: parsed.data.userId } });
  }

  await recordActivity({
    actorId: principal.userId,
    action: parsed.data.status === 'DISABLED' ? 'admin.staff_disabled' : 'admin.staff_enabled',
    entityType: 'User',
    entityId: parsed.data.userId,
  });
  revalidatePath('/admin/settings/users');
  return { success: parsed.data.status === 'DISABLED' ? 'Account disabled.' : 'Account re-enabled.' };
}
