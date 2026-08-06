import { requireSession, requireRole, guardErrorResponse } from '../../../../lib/portal/auth-guard';
import { SUPER_ADMIN_ONLY } from '../../../../lib/portal/roles';
import { listBackups, readBackupFile } from '../../../../lib/portal/backup';

// Session-gated directly rather than the signed-URL pattern used
// elsewhere (documents/photos/media) — those exist so a browser can load
// an <img src> or a cross-origin fetch without cookies attached. A
// backup download is always a direct click from inside an authenticated
// /admin/settings/backup page, cookies included, so the ordinary session
// check is both simpler and equally secure here.
export async function GET(request: Request) {
  try {
    const principal = await requireSession();
    requireRole(principal, SUPER_ADMIN_ONLY);

    const fileName = new URL(request.url).searchParams.get('file');
    if (!fileName) {
      return Response.json({ error: 'Missing file.' }, { status: 400 });
    }

    const backups = await listBackups();
    if (!backups.some((b) => b.fileName === fileName)) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }

    const data = await readBackupFile(fileName);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
