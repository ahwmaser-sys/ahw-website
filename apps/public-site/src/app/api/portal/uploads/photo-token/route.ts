import { randomUUID } from 'crypto';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../../../../../lib/portal/auth-guard';
import { STAFF_ROLES } from '../../../../../lib/portal/roles';
import { prisma } from '../../../../../lib/portal/db';
import { recordActivity } from '../../../../../lib/portal/audit';

// Same direct-to-Blob pattern as document-token/route.ts, for the same
// reason (a 20MB photo — a normal phone-camera file size — hit the
// exact same Vercel platform request-size ceiling the old uploadPhoto
// Server Action couldn't avoid). The one difference: the old action
// optimized every photo through sharp (resize/re-encode) before saving,
// which required the raw bytes server-side. A direct-to-Blob upload
// never gives this server the bytes at upload time, so the optimization
// step below runs in onUploadCompleted instead — it fetches the just-
// uploaded raw blob back, re-encodes it exactly like before, saves the
// optimized version as a second blob, and deletes the raw original so
// only the optimized file is ever kept.
const ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 20 * 1024 * 1024; // 20MB, pre-optimization — same limit the old action enforced

type PhotoPhase = 'BEFORE' | 'DURING' | 'AFTER';

interface ClientPayload {
  projectId: string;
  phase: PhotoPhase;
  caption?: string;
  fileSize: number;
}

interface TokenPayload extends ClientPayload {
  uploadedById: string;
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const principal = await requireSession();
        requireRole(principal, STAFF_ROLES);

        if (!clientPayload) throw new Error('Missing upload details.');
        const parsed = JSON.parse(clientPayload) as Partial<ClientPayload>;
        if (!parsed.projectId || !parsed.phase || !parsed.fileSize) {
          throw new Error('Missing upload details.');
        }
        if (parsed.fileSize > MAX_PHOTO_BYTES) {
          throw new Error('Image is larger than the 20MB limit.');
        }

        return {
          allowedContentTypes: ALLOWED_PHOTO_MIMES,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ...parsed, uploadedById: principal.userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const { projectId, phase, caption, uploadedById } = JSON.parse(tokenPayload) as TokenPayload;

        const rawRes = await fetch(blob.url);
        if (!rawRes.ok) throw new Error(`Could not re-fetch uploaded photo: ${rawRes.status}`);
        const rawBuffer = Buffer.from(await rawRes.arrayBuffer());

        // Same "quality first, weight via delivery" optimization the old
        // uploadPhoto action applied inline.
        const optimized = await sharp(rawBuffer).rotate().resize({ width: 2400, withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
        const optimizedBlob = await put(`${projectId}/photos/${randomUUID()}.jpg`, optimized, { access: 'public', addRandomSuffix: false });
        await del(blob.url).catch(() => {
          // Raw original already served its purpose — a failed cleanup
          // here just leaves one extra blob behind, never blocks the
          // photo record from being created.
        });

        const photo = await prisma.photo.create({
          data: {
            projectId,
            storageKey: optimizedBlob.url,
            phase,
            caption: caption || null,
          },
        });

        await recordActivity({
          actorId: uploadedById,
          action: 'admin.photo_uploaded',
          entityType: 'Photo',
          entityId: photo.id,
          projectId,
          metadata: { phase },
        });

        revalidatePath(`/admin/projects/${projectId}`);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Upload failed.' }, { status: 400 });
  }
}
