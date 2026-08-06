import { cookies } from 'next/headers';
import { requireSession, requireRole } from '../../../../../../../lib/portal/auth-guard';
import { SUPER_ADMIN_ONLY } from '../../../../../../../lib/portal/roles';
import { exchangeCode, type OAuthIntegration } from '../../../../../../../lib/portal/integrations/oauth';
import { connectIntegration } from '../../../../../../../lib/portal/integrations/store';
import { recordActivity } from '../../../../../../../lib/portal/audit';
import { getSiteUrl } from '../../../../../../../lib/site-config';

const VALID_TYPES: readonly OAuthIntegration[] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS'];
// These two platforms' access tokens alone aren't enough to publish —
// LinkedIn needs an Organization URN, Google Business Profile needs a
// Location ID, and neither is safely auto-discoverable from the token
// scopes this app requests. The Integrations page prompts for the
// missing field once OAuth lands here, rather than pretending one
// redirect is the whole story.
const NEEDS_FOLLOW_UP: ReadonlySet<OAuthIntegration> = new Set(['LINKEDIN', 'GOOGLE_BUSINESS']);

async function redirectToSettings(query: string): Promise<Response> {
  const base = await getSiteUrl();
  return Response.redirect(`${base}/admin/settings/integrations?${query}`);
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as OAuthIntegration)) {
    return Response.json({ error: 'Unknown integration.' }, { status: 404 });
  }
  const oauthType = type as OAuthIntegration;

  try {
    const principal = await requireSession();
    requireRole(principal, SUPER_ADMIN_ONLY);

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error');
    if (oauthError) {
      return await redirectToSettings(`error=${encodeURIComponent(`${oauthType} declined: ${oauthError}`)}`);
    }
    if (!code || !state) {
      return await redirectToSettings(`error=${encodeURIComponent('Missing OAuth code or state.')}`);
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get(`oauth_state_${oauthType}`)?.value;
    const officeId = cookieStore.get(`oauth_office_${oauthType}`)?.value;
    cookieStore.delete(`oauth_state_${oauthType}`);
    cookieStore.delete(`oauth_office_${oauthType}`);
    if (!expectedState || expectedState !== state) {
      return await redirectToSettings(`error=${encodeURIComponent('OAuth state mismatch — please try connecting again.')}`);
    }
    if (!officeId) {
      return await redirectToSettings(`error=${encodeURIComponent('Missing office context — please try connecting again from the office\'s Connect button.')}`);
    }

    const result = await exchangeCode(oauthType, code);

    await connectIntegration(oauthType, result, {
      metadata: { pageName: result.pageName, needsFollowUp: NEEDS_FOLLOW_UP.has(oauthType) },
      connectedById: principal.userId,
      officeId,
    });

    await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: `${oauthType}:${officeId}` });

    return await redirectToSettings(
      NEEDS_FOLLOW_UP.has(oauthType)
        ? `connected=${oauthType}&followUp=1&officeId=${officeId}`
        : `connected=${oauthType}&officeId=${officeId}`
    );
  } catch (error) {
    return await redirectToSettings(`error=${encodeURIComponent(error instanceof Error ? error.message : 'OAuth connection failed.')}`);
  }
}
