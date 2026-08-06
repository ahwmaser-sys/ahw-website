import { cookies } from 'next/headers';
import { requireSession, requireRole, guardErrorResponse } from '../../../../../../../lib/portal/auth-guard';
import { SUPER_ADMIN_ONLY } from '../../../../../../../lib/portal/roles';
import { buildAuthUrl, generateOAuthState, isOAuthAppConfigured, type OAuthIntegration } from '../../../../../../../lib/portal/integrations/oauth';
import { getOfficeById } from '../../../../../../../lib/portal/offices';

const VALID_TYPES: readonly OAuthIntegration[] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS'];

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const principal = await requireSession();
    requireRole(principal, SUPER_ADMIN_ONLY);

    const { type } = await params;
    if (!VALID_TYPES.includes(type as OAuthIntegration)) {
      return Response.json({ error: 'Unknown integration.' }, { status: 404 });
    }
    const oauthType = type as OAuthIntegration;

    // Every social platform connection belongs to exactly one office (each
    // office runs its own Instagram/Facebook/LinkedIn/Google Business) —
    // the Integrations page always links here with ?officeId=..., never
    // ambiguous about which office's credential this OAuth run creates.
    const officeId = new URL(request.url).searchParams.get('officeId');
    if (!officeId || !(await getOfficeById(officeId))) {
      return Response.json({ error: 'A valid officeId is required to connect a social platform.' }, { status: 400 });
    }

    if (!isOAuthAppConfigured(oauthType)) {
      return Response.json(
        { error: `No OAuth app credentials configured for ${oauthType}. This is a one-time infrastructure step — see the go-live report's Remaining Owner Decisions.` },
        { status: 409 }
      );
    }

    const state = generateOAuthState();
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 600,
    };
    cookieStore.set(`oauth_state_${oauthType}`, state, cookieOptions);
    cookieStore.set(`oauth_office_${oauthType}`, officeId, cookieOptions);

    return Response.redirect(buildAuthUrl(oauthType, state));
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
