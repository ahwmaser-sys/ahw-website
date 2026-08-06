'use server';

import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { CLIENT_MANAGEMENT_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { hashPassword } from '../password';
import { sendEmail, clientWelcomeEmail } from '../email';
import { getSiteUrl } from '../../site-config';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour, same as every other password-setup link in this app

const createClientSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required.'),
  officeId: z.string().trim().min(1, 'Office is required.'),
  contactName: z.string().trim().min(1, 'Contact name is required.'),
  contactEmail: z.string().trim().email('Enter a valid email.'),
});

export async function createClient(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, CLIENT_MANAGEMENT_ROLES);

  // Settings → Client Portal's "Allow Invitations" switch — off means no
  // new client account can be created (existing ones are unaffected),
  // e.g. while onboarding is paused. SUPER_ADMIN can still flip it back
  // from Settings at any time.
  const portalSettings = await prisma.portalSettings.findFirst();
  if (portalSettings && !portalSettings.allowInvitations) {
    return { error: 'New client invitations are currently disabled in Settings → Client Portal.' };
  }

  const parsed = createClientSchema.safeParse({
    companyName: formData.get('companyName'),
    officeId: formData.get('officeId'),
    contactName: formData.get('contactName'),
    contactEmail: formData.get('contactEmail'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { companyName, officeId, contactName, contactEmail } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: contactEmail } });
  if (existing) {
    return { error: 'A user with this email already exists.' };
  }

  // Never a manually-typed or emailed password — same pattern as
  // inviteStaffUser: a random, never-shared password (the account is
  // unusable until the client sets their own via the welcome email's
  // link) rather than an admin choosing and transmitting one.
  const randomPassword = randomBytes(32).toString('hex');
  const passwordHash = await hashPassword(randomPassword);

  const { client, userId } = await prisma.$transaction(async (tx) => {
    const createdClient = await tx.client.create({ data: { companyName, officeId } });
    const user = await tx.user.create({
      data: {
        email: contactEmail,
        passwordHash,
        role: 'CLIENT',
        name: contactName,
        clientId: createdClient.id,
        emailVerifiedAt: new Date(),
      },
    });
    return { client: createdClient, userId: user.id };
  });

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt: new Date(Date.now() + RESET_TTL_MS) } });

  const siteUrl = await getSiteUrl();
  await sendEmail({ to: contactEmail, ...clientWelcomeEmail(companyName, `${siteUrl}/client/reset-password/${token}`) });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.client_created',
    entityType: 'Client',
    entityId: client.id,
    metadata: { companyName, contactEmail },
  });

  revalidatePath('/admin/clients');
  redirect('/admin/clients');
}

const archiveClientSchema = z.object({ clientId: z.string().min(1) });

// Soft delete — a Client is referenced by its User (login), its
// Projects' memberships, and years of Portal history, so archiving
// (hide from the default list, block new logins) is the right default
// rather than a destructive delete.
export async function archiveClient(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, CLIENT_MANAGEMENT_ROLES);

  const parsed = archiveClientSchema.safeParse({ clientId: formData.get('clientId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.client.update({ where: { id: parsed.data.clientId }, data: { archivedAt: new Date() } });
  await recordActivity({ actorId: principal.userId, action: 'admin.client_archived', entityType: 'Client', entityId: parsed.data.clientId });
  revalidatePath('/admin/clients');
  return { success: 'Client archived.' };
}

export async function restoreClient(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, CLIENT_MANAGEMENT_ROLES);

  const parsed = archiveClientSchema.safeParse({ clientId: formData.get('clientId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.client.update({ where: { id: parsed.data.clientId }, data: { archivedAt: null } });
  await recordActivity({ actorId: principal.userId, action: 'admin.client_restored', entityType: 'Client', entityId: parsed.data.clientId });
  revalidatePath('/admin/clients');
  return { success: 'Client restored.' };
}

// Hard delete — only actually reaches the database when the Client has
// no projects and no linked user (Prisma's own FK constraints would
// otherwise reject it); relies on that DB-level restrict as the real
// safety net, same principle as Category/Tag's cascade-only deletes
// being the case where a hard delete is genuinely safe.
export async function deleteClient(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = archiveClientSchema.safeParse({ clientId: formData.get('clientId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId }, include: { user: true, memberships: true } });
  if (!client) return { error: 'Not found.' };
  if (client.memberships.length > 0) {
    return { error: 'This client has project memberships — archive instead of deleting to keep that history.' };
  }

  await prisma.$transaction(async (tx) => {
    if (client.user) await tx.user.delete({ where: { id: client.user.id } });
    await tx.client.delete({ where: { id: client.id } });
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.client_deleted', entityType: 'Client', entityId: parsed.data.clientId });
  revalidatePath('/admin/clients');
  return { success: 'Client deleted.' };
}

const updateClientSchema = z.object({
  clientId: z.string().min(1),
  companyName: z.string().trim().min(1, 'Company name is required.'),
  officeId: z.string().trim().min(1, 'Office is required.'),
});

export async function updateClient(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, CLIENT_MANAGEMENT_ROLES);

  const parsed = updateClientSchema.safeParse({
    clientId: formData.get('clientId'),
    companyName: formData.get('companyName'),
    officeId: formData.get('officeId'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  await prisma.client.update({
    where: { id: parsed.data.clientId },
    data: { companyName: parsed.data.companyName, officeId: parsed.data.officeId },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.client_updated',
    entityType: 'Client',
    entityId: parsed.data.clientId,
  });

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  return { success: 'Client details updated.' };
}

const toggleSchema = z.object({
  userId: z.string().min(1),
  clientId: z.string().min(1),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

// A single action branching on a hidden `status` field, rather than two
// curried factories — a function returned from calling another 'use
// server' export isn't itself a registered server action reference, so
// the two enable/disable buttons below both post here with different
// hidden field values instead.
export async function setClientUserStatus(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, CLIENT_MANAGEMENT_ROLES);

  const parsed = toggleSchema.safeParse({
    userId: formData.get('userId'),
    clientId: formData.get('clientId'),
    status: formData.get('status'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }
  const { userId, clientId, status } = parsed.data;

  await prisma.user.update({ where: { id: userId }, data: { status } });

  // Disabling immediately invalidates any active sessions rather than
  // waiting for expiry — the same "takes effect on the very next
  // request" principle session.ts already applies on every read.
  if (status === 'DISABLED') {
    await prisma.session.deleteMany({ where: { userId } });
  }

  await recordActivity({
    actorId: principal.userId,
    action: status === 'DISABLED' ? 'admin.client_disabled' : 'admin.client_enabled',
    entityType: 'User',
    entityId: userId,
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath('/admin/clients');
  return { success: status === 'DISABLED' ? 'Client account disabled.' : 'Client account re-enabled.' };
}

const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  clientId: z.string().min(1),
  newPassword: z.string().min(10, 'Password must be at least 10 characters.'),
});

export async function resetClientPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, CLIENT_MANAGEMENT_ROLES);

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get('userId'),
    clientId: formData.get('clientId'),
    newPassword: formData.get('newPassword'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: parsed.data.userId }, data: { passwordHash } }),
    // A password reset by an admin invalidates existing sessions, same
    // as the client's own self-service reset flow (C2) does.
    prisma.session.deleteMany({ where: { userId: parsed.data.userId } }),
  ]);

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.client_password_reset',
    entityType: 'User',
    entityId: parsed.data.userId,
  });

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  return { success: 'Password reset. The client has been signed out everywhere and must use the new password.' };
}
