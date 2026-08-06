import { requireSession, requireProjectAccess, guardErrorResponse } from '../../../../../lib/portal/auth-guard';
import { prisma } from '../../../../../lib/portal/db';

// The first real protected-resource endpoint: fetch a single project by
// id. Every request is scoped at the data layer via requireProjectAccess
// — a CLIENT principal that isn't a member of this project gets a 403
// regardless of what the UI would have shown, per the brief's "hiding a
// button is not authorization" requirement.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireSession();
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        milestones: { orderBy: { sortOrder: 'asc' } },
        documents: { select: { id: true, fileName: true, fileType: true, fileSize: true, category: true, createdAt: true } },
        photos: { select: { id: true, storageKey: true, caption: true, phase: true, takenAt: true } },
      },
    });

    if (!project) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }

    await requireProjectAccess(principal, project.id);

    return Response.json({ project });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Server error.' }, { status: 500 });
  }
}
