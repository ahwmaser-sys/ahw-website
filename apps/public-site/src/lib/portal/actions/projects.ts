'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.'),
  officeId: z.string().trim().min(1, 'Office is required.'),
  description: z.string().trim().optional(),
});

export async function createProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createProjectSchema.safeParse({
    name: formData.get('name'),
    officeId: formData.get('officeId'),
    description: formData.get('description') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const project = await prisma.project.create({
    data: { name: parsed.data.name, officeId: parsed.data.officeId, description: parsed.data.description ?? null },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.project_created',
    entityType: 'Project',
    entityId: project.id,
    projectId: project.id,
  });

  revalidatePath('/admin/projects');
  redirect(`/admin/projects/${project.id}`);
}

const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().trim().min(1, 'Project name is required.'),
  officeId: z.string().trim().min(1, 'Office is required.'),
  description: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
  progressPercent: z.coerce.number().int().min(0).max(100),
});

export async function updateProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = updateProjectSchema.safeParse({
    projectId: formData.get('projectId'),
    name: formData.get('name'),
    officeId: formData.get('officeId'),
    description: formData.get('description') || undefined,
    status: formData.get('status'),
    progressPercent: formData.get('progressPercent'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { projectId, ...data } = parsed.data;

  await prisma.project.update({
    where: { id: projectId },
    data: { name: data.name, officeId: data.officeId, description: data.description ?? null, status: data.status, progressPercent: data.progressPercent },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.project_updated',
    entityType: 'Project',
    entityId: projectId,
    projectId,
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: 'Project updated.' };
}

export async function deleteProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const projectId = formData.get('projectId');
  if (typeof projectId !== 'string' || !projectId) {
    return { error: 'Invalid request.' };
  }

  // Hard delete cascades away every document, invoice, message, and
  // photo tied to this project — genuinely safe only when there's no
  // real history to lose. A project with any of that should be
  // Archived (status dropdown above) instead, which keeps everything
  // and just hides it from the default view.
  const counts = await prisma.project.findUnique({
    where: { id: projectId },
    select: { _count: { select: { documents: true, invoices: true, messages: true, photos: true } } },
  });
  if (!counts) {
    return { error: 'Not found.' };
  }
  const { documents, invoices, messages, photos } = counts._count;
  if (documents + invoices + messages + photos > 0) {
    return { error: 'This project has documents, invoices, messages, or photos — archive it instead of deleting to keep that history.' };
  }

  await prisma.project.delete({ where: { id: projectId } });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.project_deleted',
    entityType: 'Project',
    entityId: projectId,
  });

  revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

const assignMemberSchema = z.object({ projectId: z.string().min(1), clientId: z.string().min(1) });

export async function assignClientToProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = assignMemberSchema.safeParse({ projectId: formData.get('projectId'), clientId: formData.get('clientId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId }, include: { user: true } });
  if (!client?.user) {
    return { error: 'That client has no portal login yet — add one from the Clients page first.' };
  }

  const existing = await prisma.projectMember.findFirst({
    where: { projectId: parsed.data.projectId, userId: client.user.id },
  });
  if (existing) {
    return { error: 'Already assigned to this project.' };
  }

  await prisma.projectMember.create({
    data: { projectId: parsed.data.projectId, userId: client.user.id, clientId: client.id },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.client_assigned',
    entityType: 'ProjectMember',
    projectId: parsed.data.projectId,
    metadata: { clientId: client.id },
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: `${client.companyName} assigned to this project.` };
}

const removeMemberSchema = z.object({ membershipId: z.string().min(1), projectId: z.string().min(1) });

export async function removeMemberFromProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = removeMemberSchema.safeParse({
    membershipId: formData.get('membershipId'),
    projectId: formData.get('projectId'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.projectMember.delete({ where: { id: parsed.data.membershipId } });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.client_unassigned',
    entityType: 'ProjectMember',
    entityId: parsed.data.membershipId,
    projectId: parsed.data.projectId,
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Removed from project.' };
}

const createMilestoneSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required.'),
  dueDate: z.string().optional(),
});

export async function createMilestone(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createMilestoneSchema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    dueDate: formData.get('dueDate') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const count = await prisma.milestone.count({ where: { projectId: parsed.data.projectId } });

  await prisma.milestone.create({
    data: {
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      sortOrder: count,
    },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.milestone_created',
    entityType: 'Milestone',
    projectId: parsed.data.projectId,
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Milestone added.' };
}

const toggleMilestoneSchema = z.object({
  milestoneId: z.string().min(1),
  projectId: z.string().min(1),
  completed: z.enum(['true', 'false']),
});

export async function toggleMilestone(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = toggleMilestoneSchema.safeParse({
    milestoneId: formData.get('milestoneId'),
    projectId: formData.get('projectId'),
    completed: formData.get('completed'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.milestone.update({
    where: { id: parsed.data.milestoneId },
    data: { completedAt: parsed.data.completed === 'true' ? new Date() : null },
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Milestone updated.' };
}

const postUpdateSchema = z.object({ projectId: z.string().min(1), body: z.string().trim().min(1, 'Update text is required.') });

export async function postProjectUpdate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = postUpdateSchema.safeParse({ projectId: formData.get('projectId'), body: formData.get('body') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const update = await prisma.projectUpdate.create({
    data: { projectId: parsed.data.projectId, authorId: principal.userId, body: parsed.data.body },
  });

  // Notify every client-side member of this project — a project update
  // is exactly the kind of event C5's notification list needs to show.
  const members = await prisma.projectMember.findMany({
    where: { projectId: parsed.data.projectId, userId: { not: null } },
  });
  if (members.length > 0) {
    await prisma.notification.createMany({
      data: members
        .filter((m) => m.userId)
        .map((m) => ({
          userId: m.userId as string,
          title: 'Project update posted',
          body: parsed.data.body.slice(0, 200),
        })),
    });
  }

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.project_update_posted',
    entityType: 'ProjectUpdate',
    entityId: update.id,
    projectId: parsed.data.projectId,
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Update posted.' };
}
