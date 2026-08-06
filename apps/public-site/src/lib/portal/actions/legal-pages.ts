'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { LegalPageType } from '@prisma/client';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { LEGAL_PAGE_ROUTES } from '../legal-pages';
import type { ActionState } from '../../../components/portal/ActionForm';

const schema = z.object({
  type: z.enum(['PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'COOKIE_POLICY', 'DATA_DELETION']),
  title: z.string().trim().min(1, 'Title is required.'),
  body: z.string().trim().min(1, 'Body is required.'),
});

// Title and body only — slug (and therefore the public route) is fixed
// per type; these four legal documents live at stable, predictable URLs
// (privacy-policy/terms-of-service/cookie-policy/data-deletion) so Meta/
// Google/LinkedIn developer app configuration never breaks from a content
// edit here.
export async function updateLegalPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = schema.safeParse({
    type: formData.get('type'),
    title: formData.get('title'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const existing = await prisma.legalPage.findUnique({ where: { type: parsed.data.type } });
  if (existing) {
    await prisma.legalPage.update({ where: { id: existing.id }, data: { title: parsed.data.title, body: parsed.data.body } });
  } else {
    const slugs: Record<LegalPageType, string> = {
      PRIVACY_POLICY: 'privacy-policy',
      TERMS_OF_SERVICE: 'terms-of-service',
      COOKIE_POLICY: 'cookie-policy',
      DATA_DELETION: 'data-deletion',
    };
    await prisma.legalPage.create({ data: { type: parsed.data.type, title: parsed.data.title, body: parsed.data.body, slug: slugs[parsed.data.type] } });
  }

  await recordActivity({ actorId: principal.userId, action: 'admin.legal_page_updated', entityType: 'LegalPage', entityId: parsed.data.type });

  revalidatePath('/admin/settings/legal');
  revalidatePath(LEGAL_PAGE_ROUTES[parsed.data.type]);
  return { success: 'Saved.' };
}
