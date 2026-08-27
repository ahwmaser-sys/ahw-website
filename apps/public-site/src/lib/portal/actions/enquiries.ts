'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
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
  revalidatePath(`/admin/enquiries/${parsed.data.enquiryId}`);
  return { success: 'Status updated.' };
}

const enquiryIdSchema = z.object({ enquiryId: z.string().min(1) });

// Archiving is a visibility/housekeeping toggle only — deliberately
// independent of `status` above (see schema.prisma's Enquiry model
// comment). Every staff role that can change status can also archive;
// there's no destructive risk here since restoreEnquiry fully reverses it.
export async function archiveEnquiry(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = enquiryIdSchema.safeParse({ enquiryId: formData.get('enquiryId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.enquiry.update({ where: { id: parsed.data.enquiryId }, data: { archivedAt: new Date() } });
  await recordActivity({ actorId: principal.userId, action: 'admin.enquiry_archived', entityType: 'Enquiry', entityId: parsed.data.enquiryId });
  revalidatePath('/admin/enquiries');
  revalidatePath(`/admin/enquiries/${parsed.data.enquiryId}`);
  return { success: 'Enquiry archived — hidden from the default list, still kept for the record.' };
}

export async function restoreEnquiry(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = enquiryIdSchema.safeParse({ enquiryId: formData.get('enquiryId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.enquiry.update({ where: { id: parsed.data.enquiryId }, data: { archivedAt: null } });
  await recordActivity({ actorId: principal.userId, action: 'admin.enquiry_restored', entityType: 'Enquiry', entityId: parsed.data.enquiryId });
  revalidatePath('/admin/enquiries');
  revalidatePath(`/admin/enquiries/${parsed.data.enquiryId}`);
  return { success: 'Enquiry restored.' };
}

// Hard delete, gated to SUPER_ADMIN_ONLY (same bar as deleteOffice/
// deleteClient) since it's irreversible — unlike those, no guard against
// existing references is needed: nothing in the schema has a foreign key
// to Enquiry, so deleting one can never orphan another record.
export async function deleteEnquiry(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = enquiryIdSchema.safeParse({ enquiryId: formData.get('enquiryId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.enquiry.delete({ where: { id: parsed.data.enquiryId } });
  await recordActivity({ actorId: principal.userId, action: 'admin.enquiry_deleted', entityType: 'Enquiry', entityId: parsed.data.enquiryId });
  revalidatePath('/admin/enquiries');
  return { success: 'Enquiry deleted.' };
}
