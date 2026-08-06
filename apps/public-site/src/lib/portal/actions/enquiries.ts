'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const schema = z.object({
  enquiryId: z.string().min(1),
  status: z.enum(['New', 'Contacted', 'Closed']),
});

export async function updateEnquiryStatus(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = schema.safeParse({ enquiryId: formData.get('enquiryId'), status: formData.get('status') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.enquiry.update({ where: { id: parsed.data.enquiryId }, data: { status: parsed.data.status } });
  await recordActivity({ actorId: principal.userId, action: 'admin.enquiry_status_updated', entityType: 'Enquiry', entityId: parsed.data.enquiryId, metadata: { status: parsed.data.status } });
  revalidatePath('/admin/enquiries');
  return { success: 'Status updated.' };
}
