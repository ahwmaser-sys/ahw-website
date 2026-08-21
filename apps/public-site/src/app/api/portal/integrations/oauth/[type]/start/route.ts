import { cookies } from 'next/headers';
import { requireSession, requireRole, guardErrorResponse } from '../../../../../../../lib/portal/auth-guard';
import { SUPER_ADMIN_ONLY } from '../../../../../../../lib/portal/roles';
import { buildAuthUrl, generateOAuthState, isOAuthAppConfigured, type OAuthIntegration } from '../../../../../../../lib/portal/integrations/oauth';
import { buildAdAuthUrl, generateAdOAuthState, isAdOAuthAppConfigured, AD_OAUTH_TYPES, type AdOAuthType } from '../../../../../../../lib/portal/integrations/ad-oauth';
import { getOfficeById } from '../../../../../../../lib/portal/offices';

const SOCIAL_TYPES: readonly OAuthIntegration[] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS'];

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const principal = await requireSession();
    requireRole(principal, SUPER_ADMIN_ONLY);

    const { type } = await params;
    const isSocial = SOCIAL_TYPES.includes(type as OAuthIntegration);
    const isAd = AD_OAUTH_TYPES.includes(type as AdOAuthType);
    if (!isSocial && !isAd) {
      return Response.json({ error: 'Unknown integration.' }, { status: 404 });
    }

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 600,
    };

    if (isSocial) {
      const oauthType = type as OAuthIntegration;
      // Every social platform connection belongs to exactly one office
      // (each office runs its own Instagram/Facebook/LinkedIn/Google
      // Business) — the Integrations page always links here with
      // ?officeId=..., never ambiguous about which office's credential
      // this OAuth run creates.
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
      cookieStore.set(`oauth_state_${oauthType}`, state, cookieOptions);
      cookieStore.set(`oauth_office_${oauthType}`, officeId, cookieOptions);
      return Response.redirect(buildAuthUrl(oauthType, state));
    }

    // Ad platforms (GOOGLE_ADS/META_ADS/LINKEDIN_ADS/TIKTOK_ADS) are
    // company-wide — no officeId required or stored.
    const adType = type as AdOAuthType;
    if (!isAdOAuthAppConfigured(adType)) {
      return Response.json(
        { error: `No OAuth app credentials configured for ${adType}. This is a one-time infrastructure step — see the Marketing Ads Control Center manual's platform setup section.` },
        { status: 409 }
      );
    }
    const state = generateAdOAuthState();
    cookieStore.set(`oauth_state_${adType}`, state, cookieOptions);
    return Response.redirect(buildAdAuthUrl(adType, state));
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
