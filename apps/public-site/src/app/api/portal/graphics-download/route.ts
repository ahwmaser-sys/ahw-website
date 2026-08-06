import { prisma } from '../../../../lib/portal/db';
import { verifyGraphicOutputToken } from '../../../../lib/portal/signed-url';
import { readFileByKey } from '../../../../lib/portal/storage';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return Response.json({ error: 'Missing token.' }, { status: 401 });
  }

  const outputId = verifyGraphicOutputToken(token);
  if (!outputId) {
    return Response.json({ error: 'This link is invalid or has expired.' }, { status: 401 });
  }

  const output = await prisma.generatedGraphicOutput.findUnique({ where: { id: outputId } });
  if (!output) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }

  const data = await readFileByKey(output.storageKey);

  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${output.purpose}.png"`,
      'Cache-Control': 'no-store',
    },
  });
}
