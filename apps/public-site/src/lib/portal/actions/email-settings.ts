'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { getEmailSettings } from '../email-settings';
import type { ActionState } from '../../../components/portal/ActionForm';

const optionalEmail = z.union([z.string().trim().email('Enter a valid email.'), z.literal('')]).optional();
const optionalText = z.string().trim().optional();

// One From Name / From Email / Reply-To triple per sender-identity
// type — separate from the recipient fields above. Unset means the
// hardcoded default sender still applies (see
// lib/portal/email-settings.ts's resolveSenderIdentity).
const senderIdentityFields = {
  contactFromName: optionalText,
  contactFromEmail: optionalEmail,
  contactReplyTo: optionalEmail,
  careersFromName: optionalText,
  careersFromEmail: optionalEmail,
  careersReplyTo: optionalEmail,
  supportFromName: optionalText,
  supportFromEmail: optionalEmail,
  supportReplyTo: optionalEmail,
  salesFromName: optionalText,
  salesFromEmail: optionalEmail,
  salesReplyTo: optionalEmail,
  marketingFromName: optionalText,
  marketingFromEmail: optionalEmail,
  marketingReplyTo: optionalEmail,
} as const;

const emailSettingsSchema = z.object({
  primaryContactEmail: z.string().trim().email('Enter a valid primary contact email.'),
  secondaryContactEmail: optionalEmail,
  careersEmail: optionalEmail,
  hrEmail: optionalEmail,
  supportEmail: optionalEmail,
  salesEmail: optionalEmail,
  ...senderIdentityFields,
});

const SENDER_IDENTITY_KEYS = Object.keys(senderIdentityFields) as (keyof typeof senderIdentityFields)[];

// The one place every destination inbox this app emails (Contact, Careers,
// and anything added later) is set — never an .env edit. Careers/HR/
// Support/Sales are optional and cascade to Primary when unset (see
// lib/portal/email-settings.ts's getEmailSettings and the Careers/Contact
// routes' own cascades) so the app always has somewhere real to send.
export async function updateEmailSettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = emailSettingsSchema.safeParse({
    primaryContactEmail: formData.get('primaryContactEmail'),
    secondaryContactEmail: formData.get('secondaryContactEmail'),
    careersEmail: formData.get('careersEmail'),
    hrEmail: formData.get('hrEmail'),
    supportEmail: formData.get('supportEmail'),
    salesEmail: formData.get('salesEmail'),
    ...Object.fromEntries(SENDER_IDENTITY_KEYS.map((key) => [key, formData.get(key)])),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  const existing = await getEmailSettings();

  // updateMany (matching every row, not just `existing.id`) rather than
  // update() — this table has no database-level singleton constraint,
  // and a stray duplicate row can exist (see the orderBy comment in
  // getEmailSettings). Targeting only existing.id left any other row
  // untouched, so a later read that happened to pick a different row
  // (findFirst() has no guaranteed order) would show stale data even
  // though this save had just reported success. Updating every row
  // makes the save correct regardless of how many rows exist, without
  // needing to delete or migrate anything.
  await prisma.emailSettings.updateMany({
    where: {},
    data: {
      primaryContactEmail: data.primaryContactEmail,
      secondaryContactEmail: data.secondaryContactEmail || null,
      careersEmail: data.careersEmail || null,
      hrEmail: data.hrEmail || null,
      supportEmail: data.supportEmail || null,
      salesEmail: data.salesEmail || null,
      ...Object.fromEntries(SENDER_IDENTITY_KEYS.map((key) => [key, data[key] || null])),
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.email_settings_updated', entityType: 'EmailSettings', entityId: existing.id });

  revalidatePath('/admin/settings/email');
  return { success: 'Email settings saved.' };
}
