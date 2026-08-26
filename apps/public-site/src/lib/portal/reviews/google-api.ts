import { getFreshGoogleBusinessAccessToken } from '../integrations/google-business-token';
import { fetchGoogleBusinessApi, isGoogleBusinessQuotaPendingBody } from '../integrations/google-business-http';

// Low-level Google Business Profile Reviews API client — the one place
// that actually calls Google for this feature. Both the sync engine
// (google-sync.ts) and the Admin → Reviews "Test Connection" action
// (google-test.ts) call fetchReviewsPage() so error classification,
// token refresh, and the current endpoint/resource shape live in exactly
// one place.
//
// Endpoint verified live against Google's current official docs
// (developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list,
// last updated 2026-04-07): GET /v4/{parent=accounts/*/locations/*}/reviews
// is still the current, non-deprecated Reviews List method — Reviews were
// never migrated to the newer Business Information/Account Management
// APIs the way locations/accounts lookups were (see oauth.ts's
// discoverGoogleBusinessLocationId, which does use those newer APIs).
const REVIEWS_API_BASE = 'https://mybusiness.googleapis.com/v4';

export interface GoogleReviewer {
  displayName?: string;
  profilePhotoUrl?: string;
  isAnonymous?: boolean;
}

export interface GoogleReview {
  reviewId: string;
  reviewer?: GoogleReviewer;
  starRating: 'STAR_RATING_UNSPECIFIED' | 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  name: string; // "accounts/{account}/locations/{location}/reviews/{reviewId}" — stored as externalId
}

export interface GoogleReviewsListResponse {
  reviews?: GoogleReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
}

export type ReviewsApiPageResult =
  | { kind: 'OK'; data: GoogleReviewsListResponse }
  | { kind: 'NOT_CONNECTED'; message: string }
  | { kind: 'MISSING_LOCATION'; message: string }
  | { kind: 'UNAUTHORIZED'; message: string }
  | { kind: 'FORBIDDEN'; message: string }
  | { kind: 'QUOTA_PENDING'; message: string }
  | { kind: 'RATE_LIMITED'; message: string }
  | { kind: 'HTTP_ERROR'; message: string }
  | { kind: 'NETWORK_ERROR'; message: string };

export async function fetchReviewsPage(officeId: string, opts: { pageSize: number; pageToken?: string | undefined }): Promise<ReviewsApiPageResult> {
  const token = await getFreshGoogleBusinessAccessToken(officeId);
  if (!token.ok) {
    return { kind: token.reason === 'MISSING_LOCATION' ? 'MISSING_LOCATION' : 'NOT_CONNECTED', message: token.error };
  }

  const doFetch = (accessToken: string) => {
    const url = new URL(`${REVIEWS_API_BASE}/${token.locationId}/reviews`);
    url.searchParams.set('pageSize', String(opts.pageSize));
    if (opts.pageToken) url.searchParams.set('pageToken', opts.pageToken);
    return fetchGoogleBusinessApi(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  };

  try {
    let res = await doFetch(token.accessToken);

    // Cached expiry said this token was still good but Google disagrees —
    // force exactly one refresh-and-retry. Never repeated beyond this.
    if (res.status === 401) {
      const refreshed = await getFreshGoogleBusinessAccessToken(officeId, { force: true });
      if (!refreshed.ok) {
        return { kind: 'UNAUTHORIZED', message: refreshed.error };
      }
      res = await doFetch(refreshed.accessToken);
    }
    if (res.status === 401) {
      return { kind: 'UNAUTHORIZED', message: 'Google rejected the credential even after a token refresh. Reconnect Google Business Profile from Settings → Integrations, then try again.' };
    }
    if (res.status === 403) {
      const bodyText = await res.text().catch(() => '');
      return { kind: 'FORBIDDEN', message: `Google denied this request (403) — the connected account may lack access to this location, or a required Business Profile API isn't enabled. ${bodyText.slice(0, 200)}` };
    }
    if (res.status === 429) {
      const bodyText = await res.text().catch(() => '');
      if (isGoogleBusinessQuotaPendingBody(bodyText)) {
        return {
          kind: 'QUOTA_PENDING',
          message: 'Google API access is not yet approved for this project (quota is 0). This is expected while the Business Profile Basic API Access request (Case 0-7592000041310) is pending — no action needed here; try again after Google approves access.',
        };
      }
      return { kind: 'RATE_LIMITED', message: 'Google rate-limited this request. Wait a few minutes before trying again.' };
    }
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      return { kind: 'HTTP_ERROR', message: `Google API error (${res.status}): ${bodyText.slice(0, 300)}` };
    }

    const data = (await res.json()) as GoogleReviewsListResponse;
    return { kind: 'OK', data };
  } catch (error) {
    return { kind: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error contacting Google.' };
  }
}
