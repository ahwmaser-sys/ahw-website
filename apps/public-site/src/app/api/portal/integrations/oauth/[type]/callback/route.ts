import { cookies } from 'next/headers';
import { requireSession, requireRole } from '../../../../../../../lib/portal/auth-guard';
import { SUPER_ADMIN_ONLY } from '../../../../../../../lib/portal/roles';
import { exchangeCode, type OAuthIntegration } from '../../../../../../../lib/portal/integrations/oauth';
import { exchangeAdCode, adNeedsFollowUp, AD_OAUTH_TYPES, type AdOAuthType } from '../../../../../../../lib/portal/integrations/ad-oauth';
import { connectIntegration } from '../../../../../../../lib/portal/integrations/store';
import { recordActivity } from '../../../../../../../lib/portal/audit';
import { getSiteUrl } from '../../../../../../../lib/site-config';

const SOCIAL_TYPES: readonly OAuthIntegration[] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS'];
// LinkedIn's Organization URN is never derivable from the token scopes
// this app requests, so it always needs the manual follow-up form.
// Google Business Profile's Location ID IS sometimes auto-discoverable
// (see oauth.ts's discoverGoogleBusinessLocationId) — only prompt for it
// manually when that lookup came back empty (ambiguous account, or the
// Business Profile APIs aren't quota-approved yet on the Cloud project).
function needsFollowUp(type: OAuthIntegration, result: Record<string, unknown>): boolean {
  if (type === 'LINKEDIN') return true;
  if (type === 'GOOGLE_BUSINESS') return !result.locationId;
  return false;
}

async function redirectToSettings(query: string): Promise<Response> {
  const base = await getSiteUrl();
  return Response.redirect(`${base}/admin/settings/integrations?${query}`);
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const isSocial = SOCIAL_TYPES.includes(type as OAuthIntegration);
  const isAd = AD_OAUTH_TYPES.includes(type as AdOAuthType);
  if (!isSocial && !isAd) {
    return Response.json({ error: 'Unknown integration.' }, { status: 404 });
  }

  try {
    const principal = await requireSession();
    requireRole(principal, SUPER_ADMIN_ONLY);

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error');
    if (oauthError) {
      return await redirectToSettings(`error=${encodeURIComponent(`${type} declined: ${oauthError}`)}`);
    }
    if (!code || !state) {
      return await redirectToSettings(`error=${encodeURIComponent('Missing OAuth code or state.')}`);
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get(`oauth_state_${type}`)?.value;
    cookieStore.delete(`oauth_state_${type}`);
    if (!expectedState || expectedState !== state) {
      return await redirectToSettings(`error=${encodeURIComponent('OAuth state mismatch — please try connecting again.')}`);
    }

    if (isSocial) {
      const oauthType = type as OAuthIntegration;
      const officeId = cookieStore.get(`oauth_office_${oauthType}`)?.value;
      cookieStore.delete(`oauth_office_${oauthType}`);
      if (!officeId) {
        return await redirectToSettings(`error=${encodeURIComponent('Missing office context — please try connecting again from the office\'s Connect button.')}`);
      }

      const result = await exchangeCode(oauthType, code);
      const stillNeedsFollowUp = needsFollowUp(oauthType, result);

      await connectIntegration(oauthType, result, {
        metadata: { pageName: result.pageName, needsFollowUp: stillNeedsFollowUp },
        connectedById: principal.userId,
        officeId,
      });

      await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: `${oauthType}:${officeId}` });

      return await redirectToSettings(
        stillNeedsFollowUp ? `connected=${oauthType}&followUp=1&officeId=${officeId}` : `connected=${oauthType}&officeId=${officeId}`
      );
    }

    // Ad platform — company-wide, no officeId.
    const adType = type as AdOAuthType;
    const result = await exchangeAdCode(adType, code);
    const stillNeedsFollowUp = adNeedsFollowUp(adType, result);

    await connectIntegration(adType, result, {
      metadata: { needsFollowUp: stillNeedsFollowUp },
      connectedById: principal.userId,
    });

    await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: adType });

    return await redirectToSettings(stillNeedsFollowUp ? `connected=${adType}&followUp=1` : `connected=${adType}`);
  } catch (error) {
    return await redirectToSettings(`error=${encodeURIComponent(error instanceof Error ? error.message : 'OAuth connection failed.')}`);
  }
}
