'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const createInvoiceSchema = z.object({
  projectId: z.string().min(1),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  currency: z.string().trim().min(1).default('USD'),
  dueDate: z.string().optional(),
});

export async function createInvoice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createInvoiceSchema.safeParse({
    projectId: formData.get('projectId'),
    amount: formData.get('amount'),
    currency: formData.get('currency') || 'USD',
    dueDate: formData.get('dueDate') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const invoice = await prisma.invoice.create({
    data: {
      projectId: parsed.data.projectId,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.invoice_created',
    entityType: 'Invoice',
    entityId: invoice.id,
    projectId: parsed.data.projectId,
    metadata: { amount: parsed.data.amount, currency: parsed.data.currency },
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Invoice created.' };
}

const markPaidSchema = z.object({ invoiceId: z.string().min(1), projectId: z.string().min(1), amount: z.coerce.number().positive() });

export async function recordInvoicePayment(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = markPaidSchema.safeParse({
    invoiceId: formData.get('invoiceId'),
    projectId: formData.get('projectId'),
    amount: formData.get('amount'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId }, include: { payments: true } });
  if (!invoice) {
    return { error: 'Invoice not found.' };
  }

  const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const newTotal = alreadyPaid + parsed.data.amount;
  const nextStatus = newTotal >= Number(invoice.amount) ? 'PAID' : 'PARTIAL';

  await prisma.$transaction([
    prisma.payment.create({ data: { invoiceId: parsed.data.invoiceId, amount: parsed.data.amount } }),
    prisma.invoice.update({ where: { id: parsed.data.invoiceId }, data: { status: nextStatus } }),
  ]);

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.payment_recorded',
    entityType: 'Invoice',
    entityId: parsed.data.invoiceId,
    projectId: parsed.data.projectId,
    metadata: { amount: parsed.data.amount, nextStatus },
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Payment recorded.' };
}
