import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../../../../../lib/portal/auth-guard';
import { STAFF_ROLES } from '../../../../../lib/portal/roles';
import { prisma } from '../../../../../lib/portal/db';
import { recordActivity } from '../../../../../lib/portal/audit';

// Direct-to-Blob client upload (Vercel's own documented pattern for
// this) — replaces the old uploadDocument Server Action, which read the
// whole file into the request body of a Server Action. That body is
// subject to Vercel's platform-level request-size ceiling on serverless
// Functions (~4.5MB) regardless of next.config.js's own
// serverActions.bodySizeLimit (that setting only lifts Next's own
// guard, never the platform's) — confirmed live: a 20MB PDF failed with
// no server-side error ever logged, meaning the request was rejected
// before invocation. The browser uploads straight to Blob storage here;
// this route only ever sees a small JSON handshake, never the file
// bytes, so there's no body-size ceiling to hit for any file up to the
// 25MB app-level limit below.
//
// Trade-off, deliberate: the old action content-sniffed the real file
// bytes (file-type's magic-byte check) before accepting it. A
// direct-to-Blob upload never puts the bytes through our server at all,
// so this can only enforce the browser-declared content type via
// allowedContentTypes — acceptable here because this endpoint requires
// an authenticated staff session (onBeforeGenerateToken below), unlike
// a public upload form.
const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25MB — same limit the old action enforced

type DocumentCategory = 'DRAWING' | 'CONTRACT' | 'BOQ' | 'REPORT' | 'WARRANTY' | 'INVOICE' | 'OTHER';

interface ClientPayload {
  projectId: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
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
        if (!parsed.projectId || !parsed.category || !parsed.fileName || !parsed.fileSize) {
          throw new Error('Missing upload details.');
        }
        if (parsed.fileSize > MAX_DOCUMENT_BYTES) {
          throw new Error('File is larger than the 25MB limit.');
        }

        return {
          allowedContentTypes: ALLOWED_DOCUMENT_MIMES,
          maximumSizeInBytes: MAX_DOCUMENT_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ...parsed, uploadedById: principal.userId }),
        };
      },
      // Fires as a Vercel-to-this-deployment webhook once the browser's
      // direct upload to Blob finishes — this is where the DB row
      // actually gets created, not in the browser-facing response above.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const { projectId, category, fileName, fileSize, uploadedById } = JSON.parse(tokenPayload) as ClientPayload & { uploadedById: string };

        const document = await prisma.document.create({
          data: {
            projectId,
            storageKey: blob.url,
            fileName,
            fileType: blob.contentType,
            fileSize,
            category,
            uploadedById,
          },
        });

        await recordActivity({
          actorId: uploadedById,
          action: 'admin.document_uploaded',
          entityType: 'Document',
          entityId: document.id,
          projectId,
          metadata: { fileName, category },
        });

        revalidatePath(`/admin/projects/${projectId}`);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Upload failed.' }, { status: 400 });
  }
}
