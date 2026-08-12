import { mergeIntegrationMetadata } from '../integrations/store';
import { fetchReviewsPage } from './google-api';

// Deliberately separate from lib/portal/integrations/test.ts's generic
// GOOGLE_BUSINESS check (which verifies the credential against the
// Business Information API — a different Google API, and potentially a
// different quota/approval state than Reviews). This function verifies
// the ONE thing Admin → Reviews actually needs: can we call the Reviews
// List endpoint right now. It never imports anything — pageSize: 1, and
// the result is discarded — so "Test Connection" is always safe to click
// without affecting the review list.
//
// Writes only to IntegrationConfig.metadata's reviews-namespaced keys
// (reviewsApiVerified/reviewsLastTestedAt/reviewsLastTestError), never to
// the top-level status/lastTestedAt/lastSuccessAt/lastError columns the
// Settings → Integrations page's own Test Connection owns — the two
// "connected" signals are allowed to disagree (e.g. OAuth valid, Reviews
// quota still pending) and both surface honestly rather than one
// overwriting the other.
export interface ReviewsConnectionTestResult {
  ok: boolean;
  status: 'VERIFIED' | 'QUOTA_PENDING' | 'NOT_CONNECTED' | 'ERROR';
  message: string;
  testedAt: Date;
}

export async function testGoogleReviewsConnection(officeId: string): Promise<ReviewsConnectionTestResult> {
  const testedAt = new Date();
  const page = await fetchReviewsPage(officeId, { pageSize: 1 });

  if (page.kind === 'NOT_CONNECTED' || page.kind === 'MISSING_LOCATION') {
    return { ok: false, status: 'NOT_CONNECTED', message: page.message, testedAt };
  }
  if (page.kind === 'QUOTA_PENDING') {
    await mergeIntegrationMetadata('GOOGLE_BUSINESS', officeId, {
      reviewsApiVerified: false,
      reviewsLastTestedAt: testedAt.toISOString(),
      reviewsLastTestError: page.message,
    });
    return { ok: false, status: 'QUOTA_PENDING', message: page.message, testedAt };
  }
  if (page.kind !== 'OK') {
    await mergeIntegrationMetadata('GOOGLE_BUSINESS', officeId, {
      reviewsApiVerified: false,
      reviewsLastTestedAt: testedAt.toISOString(),
      reviewsLastTestError: page.message,
    });
    return { ok: false, status: 'ERROR', message: page.message, testedAt };
  }

  await mergeIntegrationMetadata('GOOGLE_BUSINESS', officeId, {
    reviewsApiVerified: true,
    reviewsLastTestedAt: testedAt.toISOString(),
    reviewsLastTestError: null,
  });
  const count = page.data.totalReviewCount;
  const rating = page.data.averageRating;
  return {
    ok: true,
    status: 'VERIFIED',
    message: `Connected — Google reports ${count ?? 0} review${count === 1 ? '' : 's'}${rating !== undefined ? `, average rating ${rating.toFixed(1)}` : ''}.`,
    testedAt,
  };
}
