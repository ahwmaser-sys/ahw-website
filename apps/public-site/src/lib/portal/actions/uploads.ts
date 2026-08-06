'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { saveFile } from '../storage';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_PHOTO_BYTES = 20 * 1024 * 1024; // 20MB, pre-optimization

// Real content-sniffed types only — never trust the browser-supplied
// extension or declared MIME type, per A5/C6's "validate actual content
// type not just extension" requirement.
const ALLOWED_DOCUMENT_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const ALLOWED_PHOTO_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const documentSchema = z.object({
  projectId: z.string().min(1),
  category: z.enum(['DRAWING', 'CONTRACT', 'BOQ', 'REPORT', 'WARRANTY', 'INVOICE', 'OTHER']),
});

export async function uploadDocument(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = documentSchema.safeParse({
    projectId: formData.get('projectId'),
    category: formData.get('category'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a file to upload.' };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: 'File is larger than the 25MB limit.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  // Word/Excel binary formats aren't always sniffable to their exact
  // subtype by magic bytes alone (older .doc/.xls in particular) — fall
  // back to the browser-declared type only when sniffing genuinely finds
  // nothing, never to silently accept something sniffing rejected.
  const mimeType = detected?.mime ?? file.type;
  if (!detected && !ALLOWED_DOCUMENT_MIMES.has(file.type)) {
    return { error: 'Unrecognized file type.' };
  }
  if (detected && !ALLOWED_DOCUMENT_MIMES.has(detected.mime)) {
    return { error: `File type "${detected.mime}" is not allowed.` };
  }

  const extension = detected?.ext ?? 'bin';
  const storageKey = await saveFile(`${parsed.data.projectId}/documents/${randomUUID()}.${extension}`, buffer);

  const document = await prisma.document.create({
    data: {
      projectId: parsed.data.projectId,
      storageKey,
      fileName: file.name,
      fileType: mimeType,
      fileSize: buffer.length,
      category: parsed.data.category,
      uploadedById: principal.userId,
    },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.document_uploaded',
    entityType: 'Document',
    entityId: document.id,
    projectId: parsed.data.projectId,
    metadata: { fileName: file.name, category: parsed.data.category },
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: `${file.name} uploaded.` };
}

const photoSchema = z.object({
  projectId: z.string().min(1),
  phase: z.enum(['BEFORE', 'DURING', 'AFTER']),
  caption: z.string().trim().optional(),
});

export async function uploadPhoto(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = photoSchema.safeParse({
    projectId: formData.get('projectId'),
    phase: formData.get('phase'),
    caption: formData.get('caption') || undefined,
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an image to upload.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: 'Image is larger than the 20MB limit.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_PHOTO_MIMES.has(detected.mime)) {
    return { error: 'Unsupported image type — use JPEG, PNG, or WebP.' };
  }

  // Optimize on upload, same "quality first, weight via delivery"
  // principle as A5: cap dimensions to a sane maximum, re-encode as
  // high-quality JPEG rather than storing the raw upload as-is.
  const optimized = await sharp(buffer).rotate().resize({ width: 2400, withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();

  const storageKey = await saveFile(`${parsed.data.projectId}/photos/${randomUUID()}.jpg`, optimized);

  const photo = await prisma.photo.create({
    data: {
      projectId: parsed.data.projectId,
      storageKey,
      phase: parsed.data.phase,
      caption: parsed.data.caption ?? null,
    },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.photo_uploaded',
    entityType: 'Photo',
    entityId: photo.id,
    projectId: parsed.data.projectId,
    metadata: { phase: parsed.data.phase },
  });

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { success: 'Photo uploaded.' };
}
