'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { runMediaPipeline } from '../media/pipeline';
import type { ActionState } from '../../../components/portal/ActionForm';

// Any staff member can edit their OWN profile (name/phone/job title/
// avatar) — that's the "My Profile" self-service page. Editing SOMEONE
// ELSE'S profile (the SUPER_ADMIN-only /admin/settings/users/[id] page)
// additionally requires SUPER_ADMIN. Same three actions serve both
// pages rather than duplicating this logic per surface.
async function requireProfileEditAccess(targetUserId: string) {
  const principal = await requireSession();
  if (targetUserId !== principal.userId) {
    requireRole(principal, SUPER_ADMIN_ONLY);
  }
  return principal;
}

function profilePath(userId: string, principalUserId: string): string {
  return userId === principalUserId ? '/admin/profile' : `/admin/settings/users/${userId}`;
}

const updateProfileSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required.'),
  phone: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
});

export async function updateUserProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateProfileSchema.safeParse({
    userId: formData.get('userId'),
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    jobTitle: formData.get('jobTitle') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const principal = await requireProfileEditAccess(parsed.data.userId);

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      jobTitle: parsed.data.jobTitle || null,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.profile_updated', entityType: 'User', entityId: parsed.data.userId });
  revalidatePath(profilePath(parsed.data.userId, principal.userId));
  return { success: 'Profile updated.' };
}

const avatarSchema = z.object({ userId: z.string().min(1) });

export async function setUserAvatar(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = avatarSchema.safeParse({ userId: formData.get('userId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const principal = await requireProfileEditAccess(parsed.data.userId);

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an image file.' };
  }

  let asset;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const pipelineResult = await runMediaPipeline({
      buffer,
      fileName: file.name,
      declaredType: file.type,
      kind: 'IMAGE',
      generateVariants: true,
    });
    asset = await prisma.mediaAsset.create({
      data: {
        kind: 'IMAGE',
        storageKey: pipelineResult.storageKey,
        fileName: file.name,
        fileType: pipelineResult.fileType,
        fileSize: pipelineResult.fileSize,
        width: pipelineResult.width,
        height: pipelineResult.height,
        orientation: pipelineResult.orientation,
        dominantColors: pipelineResult.dominantColors,
        uploadedById: principal.userId,
        variants: { create: pipelineResult.variants.map((v) => ({ purpose: v.purpose, storageKey: v.storageKey, width: v.width, height: v.height })) },
      },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Upload failed.' };
  }

  await prisma.user.update({ where: { id: parsed.data.userId }, data: { avatarId: asset.id } });
  await prisma.mediaAssetUsage.upsert({
    where: { assetId_entityType_entityId: { assetId: asset.id, entityType: 'User', entityId: parsed.data.userId } },
    update: {},
    create: { assetId: asset.id, entityType: 'User', entityId: parsed.data.userId },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.profile_avatar_set', entityType: 'User', entityId: parsed.data.userId });
  revalidatePath(profilePath(parsed.data.userId, principal.userId));
  return { success: 'Photo updated.' };
}

export async function clearUserAvatar(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = avatarSchema.safeParse({ userId: formData.get('userId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const principal = await requireProfileEditAccess(parsed.data.userId);

  await prisma.user.update({ where: { id: parsed.data.userId }, data: { avatarId: null } });

  revalidatePath(profilePath(parsed.data.userId, principal.userId));
  return { success: 'Photo removed.' };
}
