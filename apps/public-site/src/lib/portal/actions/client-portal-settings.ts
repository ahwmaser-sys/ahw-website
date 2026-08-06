'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const schema = z.object({
  enabled: z.enum(['true', 'false']),
  maintenanceMode: z.enum(['true', 'false']),
  allowInvitations: z.enum(['true', 'false']),
  welcomeMessage: z.string().trim().optional(),
  portalLogoAssetId: z.string().trim().optional(),
  supportEmail: z.string().trim().email('Enter a valid email.').optional().or(z.literal('')),
  supportPhone: z.string().trim().optional(),
});

// This is the switch the brief calls out by name: flipping the Client
// Portal live no longer means editing PORTAL_ENABLED in .env and
// redeploying — proxy.ts reads this row on every /client request. The
// env var still exists as the pre-seed default for a brand-new
// deployment with no row yet, and as a fail-closed fallback if the
// database is briefly unreachable — never as something the owner needs
// to touch day to day.
export async function updatePortalSettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = schema.safeParse({
    enabled: formData.get('enabled'),
    maintenanceMode: formData.get('maintenanceMode'),
    allowInvitations: formData.get('allowInvitations'),
    welcomeMessage: formData.get('welcomeMessage') || undefined,
    portalLogoAssetId: formData.get('portalLogoAssetId') || undefined,
    supportEmail: formData.get('supportEmail') || '',
    supportPhone: formData.get('supportPhone') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const data = {
    enabled: parsed.data.enabled === 'true',
    maintenanceMode: parsed.data.maintenanceMode === 'true',
    allowInvitations: parsed.data.allowInvitations === 'true',
    welcomeMessage: parsed.data.welcomeMessage || null,
    portalLogoAssetId: parsed.data.portalLogoAssetId || null,
    supportEmail: parsed.data.supportEmail || null,
    supportPhone: parsed.data.supportPhone || null,
  };

  const existing = await prisma.portalSettings.findFirst();
  if (existing) {
    await prisma.portalSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.portalSettings.create({ data });
  }

  await recordActivity({ actorId: principal.userId, action: 'admin.portal_settings_updated', metadata: { enabled: data.enabled, maintenanceMode: data.maintenanceMode } });
  revalidatePath('/admin/settings/client-portal');
  revalidatePath('/client/coming-soon');
  return { success: 'Client Portal settings saved.' };
}
