import type { Metadata } from 'next';
import { HomeContent } from './HomeContent';
import { getRotationImages, getSelectedWork } from '../lib/homepageAssets';
import { getActiveOfficesForDisplay, getOfficeBySlug } from '../lib/portal/offices';
import { getSiteUrl } from '../lib/site-config';
import { getPublishedFeaturedReviews, getGoogleReviewsAggregate } from '../lib/portal/reviews/queries';

export const metadata: Metadata = {
  // Unlike every other route, the homepage's own page.tsx lives in the
  // same segment as the root layout that defines title.template — verified
  // empirically that the template does NOT reach this one page (it doubles
  // correctly on every nested route, e.g. /about/about-us, but renders with
  // no suffix at all here), so the brand suffix must stay explicit.
  title: 'Architecture, Engineering & Construction Firm in Egypt & Kuwait | AHW Architects',
  description: 'AHW Architects is a multidisciplinary architecture, structural engineering, interior design, and design-build construction practice serving Egypt, Kuwait, and the wider GCC — master planning, MEP coordination, project management, and fit-out, from concept to final handover.',
  alternates: {
    canonical: '/',
  },
};

// The homepage reads the homepage-assets/ folders at render time. Without
// this, Next.js treats the page as fully static and only re-reads those
// folders on the next full `pnpm build` — so a curator dropping in new
// images wouldn't see them until someone rebuilds. This re-checks the
// folders at most once every 30s and serves the refreshed version on the
// next visit after that, no manual rebuild needed.
export const revalidate = 30;

export default async function HomePage() {
  const heroImages = getRotationImages('hero');
  const precisionImages = getRotationImages('precision');
  const selectedWork = getSelectedWork();
  const [offices, siteUrl, egyptOffice] = await Promise.all([getActiveOfficesForDisplay(), getSiteUrl(), getOfficeBySlug('egypt')]);

  // Client Reviews is Egypt-scoped (see build brief) — reads only from
  // our own database (editorially featured+published rows, plus the
  // last-synced Google aggregate), never a live Google API call during
  // page render. Both come back empty/null if there's no Egypt office in
  // this environment or nothing has been featured/synced yet — the
  // section below handles that as a real empty state, not an error.
  const [reviews, reviewsAggregate] = egyptOffice
    ? await Promise.all([getPublishedFeaturedReviews(egyptOffice.id), getGoogleReviewsAggregate(egyptOffice.id)])
    : [[], null];

  return (
    <HomeContent
      heroImages={heroImages}
      precisionImages={precisionImages}
      selectedWork={selectedWork}
      offices={offices}
      siteUrl={siteUrl}
      reviews={reviews}
      reviewsAggregate={reviewsAggregate}
      reviewsGoogleUrl={egyptOffice?.googleBusinessProfileUrl ?? null}
    />
  );
}
