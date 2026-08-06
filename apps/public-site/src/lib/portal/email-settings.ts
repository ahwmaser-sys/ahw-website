import { cache } from 'react';
import type { EmailSettings } from '@prisma/client';
import { prisma } from './db';

// Singleton row, same lazily-seeded pattern as BrandKit/PortalSettings/
// AISettings — every destination inbox this app emails (Contact,
// Careers, and whatever's added later) reads from here. The two seed
// values below are this deployment's real, given production addresses
// (Settings → Email later lets the owner change them); nothing in this
// app should read a destination address from an env var.
const DEFAULT_PRIMARY_CONTACT_EMAIL = 'mwardany@ahwarchitects.com';
const DEFAULT_SECONDARY_CONTACT_EMAIL = 'm.elwardany@gmail.com';

export const getEmailSettings = cache(async () => {
  const existing = await prisma.emailSettings.findFirst();
  if (existing) return existing;

  return prisma.emailSettings.create({
    data: {
      primaryContactEmail: DEFAULT_PRIMARY_CONTACT_EMAIL,
      secondaryContactEmail: DEFAULT_SECONDARY_CONTACT_EMAIL,
    },
  });
});

// The one sender identity every outbound email used before this was
// configurable — kept as the fallback so an unset type behaves exactly
// as it always did, not a regression.
const DEFAULT_FROM_NAME = 'AHW Architects';
const DEFAULT_FROM_EMAIL = 'noreply@contact.ahwspaces.com';

export type EmailSenderType = 'contact' | 'careers' | 'support' | 'sales' | 'marketing';

export interface EmailSenderIdentity {
  from: string;
  replyTo?: string;
}

// Builds the "From"/"Reply-To" a given email type sends with, from the
// admin-editable fields on EmailSettings — never hardcoded per call
// site. Falls back to the shared default sender when a type's fields
// are unset, so this is purely additive over the old hardcoded string.
export function resolveSenderIdentity(type: EmailSenderType, settings: EmailSettings): EmailSenderIdentity {
  const fromName = settings[`${type}FromName`] || DEFAULT_FROM_NAME;
  const fromEmail = settings[`${type}FromEmail`] || DEFAULT_FROM_EMAIL;
  const replyTo = settings[`${type}ReplyTo`] || undefined;
  return { from: `${fromName} <${fromEmail}>`, ...(replyTo ? { replyTo } : {}) };
}
