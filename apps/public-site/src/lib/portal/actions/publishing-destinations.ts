'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const schema = z.object({
  officeId: z.string().min(1),
  platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS']),
  isEnabled: z.enum(['true', 'false']),
});

// Toggling this is purely a "does this office's account participate in
// dispatch at all" switch — it doesn't touch credentials (Settings →
// Integrations) and doesn't affect whether a platform runs in Manual vs
// Auto mode (that's still each adapter's own isConfigured() check).
// Disabling an office+platform combination here means
// queueSocialPostsForNewsPost skips it entirely, even if that office's
// Publishing Target includes this post. A Marketing concern (which
// connected accounts actually post), not an Integrations one (whether
// the credential itself is connected) — see /admin/publishing.
export async function togglePublishingDestination(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = schema.safeParse({
    officeId: formData.get('officeId'),
    platform: formData.get('platform'),
    isEnabled: formData.get('isEnabled'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const isEnabled = parsed.data.isEnabled === 'true';

  await prisma.publishingDestination.upsert({
    where: { platform_officeId: { platform: parsed.data.platform, officeId: parsed.data.officeId } },
    update: { isEnabled },
    create: { platform: parsed.data.platform, officeId: parsed.data.officeId, isEnabled },
  });

  await recordActivity({
    actorId: principal.userId,
    action: isEnabled ? 'admin.publishing_destination_enabled' : 'admin.publishing_destination_disabled',
    metadata: { platform: parsed.data.platform, officeId: parsed.data.officeId },
  });

  revalidatePath('/admin/publishing');
  return { success: `${parsed.data.platform} ${isEnabled ? 'enabled' : 'disabled'}.` };
}
