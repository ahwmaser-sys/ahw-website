import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { getAllOffices } from '../../../lib/portal/offices';
import { getIntegrationStatus } from '../../../lib/portal/integrations/store';
import { listReviews, getReviewCounts } from '../../../lib/portal/reviews/queries';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { ReviewRowActions } from './ReviewRowActions';
import { SyncReviewsForm } from './SyncReviewsForm';
import { TestConnectionForm } from './TestConnectionForm';
import styles from '../../../components/portal/portal-ui.module.css';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

interface ReviewsPageSearchParams {
  office?: string | undefined;
  published?: string | undefined; // 'true' | 'false'
  featured?: string | undefined; // 'true' | 'false'
  rating?: string | undefined;
  source?: string | undefined;
}

// Query-param-driven filters rendered as plain links — no client-side
// filter state, consistent with how the rest of Admin keeps filtering
// server-rendered (see /admin/enquiries's ?status= pattern).
function filterLink(base: string, current: ReviewsPageSearchParams, patch: Partial<ReviewsPageSearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<ReviewsPageSearchParams> }) {
  const principal = await requireAdminPage();
  const params = await searchParams;

  const offices = await getAllOffices();
  // Default office is Egypt (this feature's scope per the build brief) —
  // falls back to the first office if an "egypt" slug doesn't exist in
  // this environment, rather than showing nothing.
  const defaultOffice = offices.find((o) => o.slug === 'egypt') ?? offices[0];
  const selectedOfficeId = params.office ?? defaultOffice?.id;
  const selectedOffice = offices.find((o) => o.id === selectedOfficeId);

  const integrationStatus = selectedOfficeId ? await getIntegrationStatus('GOOGLE_BUSINESS', selectedOfficeId) : null;
  const googleConnected = integrationStatus?.status === 'CONNECTED';
  const reviewsMetadata = (integrationStatus?.metadata as Record<string, unknown> | null) ?? {};
  // reviewsApiVerified is written only by testGoogleReviewsConnection
  // (google-test.ts) — deliberately separate from integrationStatus.status,
  // which reflects Settings → Integrations' own, different API check (see
  // that file's header comment). The two are allowed to disagree.
  const reviewsApiVerified = reviewsMetadata.reviewsApiVerified === true;
  const reviewsLastTestedAt = typeof reviewsMetadata.reviewsLastTestedAt === 'string' ? new Date(reviewsMetadata.reviewsLastTestedAt) : null;
  const reviewsLastTestError = typeof reviewsMetadata.reviewsLastTestError === 'string' ? reviewsMetadata.reviewsLastTestError : null;

  const counts = selectedOfficeId ? await getReviewCounts(selectedOfficeId) : { total: 0, published: 0 };

  const reviews = await listReviews({
    officeId: selectedOfficeId,
    published: params.published === 'true' ? true : params.published === 'false' ? false : undefined,
    featured: params.featured === 'true' ? true : params.featured === 'false' ? false : undefined,
    rating: params.rating ? Number(params.rating) : undefined,
    source: params.source === 'GOOGLE' || params.source === 'MANUAL' ? params.source : undefined,
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Client Reviews</h1>
      </div>
      <p className={styles.subtitle}>
        Google reviews are imported here, not published automatically — feature and publish each one explicitly to put it on the homepage.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Office</h2>
        <div className={styles.buttonRow}>
          {offices.map((office) => (
            <Link
              key={office.id}
              href={filterLink('/admin/reviews', params, { office: office.id })}
              className={office.id === selectedOfficeId ? styles.button : styles.buttonSecondary}
            >
              {office.displayName}
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Google Reviews Connection</h2>
        <p className={styles.cardMeta}>
          {selectedOffice?.displayName ?? 'This office'} · OAuth:{' '}
          <span className={`${styles.badge} ${googleConnected ? styles.badgeActive : styles.badgeMuted}`}>
            {googleConnected ? 'Connected' : 'Not connected'}
          </span>
          {' · '}Reviews API:{' '}
          <span className={`${styles.badge} ${reviewsApiVerified ? styles.badgeActive : styles.badgeMuted}`}>
            {reviewsApiVerified ? 'Verified' : 'Not verified'}
          </span>
        </p>
        <p className={styles.cardMeta}>
          Imported: <strong>{counts.total}</strong> · Published: <strong>{counts.published}</strong>
          {reviewsLastTestedAt && <> · Last connection test: {formatDate(reviewsLastTestedAt)}</>}
          {integrationStatus?.metadata && typeof (integrationStatus.metadata as Record<string, unknown>).reviewsLastSyncedAt === 'string' && (
            <> · Last synced: {formatDate(new Date((integrationStatus.metadata as Record<string, unknown>).reviewsLastSyncedAt as string))}</>
          )}
        </p>
        {reviewsLastTestError && (
          <p className={styles.errorMessage} role="alert">{reviewsLastTestError}</p>
        )}
        {selectedOfficeId && googleConnected ? (
          <div className={styles.buttonRow}>
            <TestConnectionForm officeId={selectedOfficeId} />
            <SyncReviewsForm officeId={selectedOfficeId} />
          </div>
        ) : (
          <p className={styles.cardMeta}>
            Google Business Profile is not connected for {selectedOffice?.displayName ?? 'this office'}. Connect it from{' '}
            <Link href="/admin/settings/integrations">Settings → Integrations</Link> before testing or syncing.
          </p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Filters</h2>
        <div className={styles.buttonRow}>
          <Link href={filterLink('/admin/reviews', params, { published: undefined })} className={!params.published ? styles.button : styles.buttonSecondary}>All</Link>
          <Link href={filterLink('/admin/reviews', params, { published: 'true' })} className={params.published === 'true' ? styles.button : styles.buttonSecondary}>Published</Link>
          <Link href={filterLink('/admin/reviews', params, { published: 'false' })} className={params.published === 'false' ? styles.button : styles.buttonSecondary}>Hidden</Link>
          <Link href={filterLink('/admin/reviews', params, { featured: 'true' })} className={params.featured === 'true' ? styles.button : styles.buttonSecondary}>Featured</Link>
          <Link href={filterLink('/admin/reviews', params, { featured: 'false' })} className={params.featured === 'false' ? styles.button : styles.buttonSecondary}>Not featured</Link>
          {[5, 4, 3, 2, 1].map((r) => (
            <Link key={r} href={filterLink('/admin/reviews', params, { rating: String(r) })} className={params.rating === String(r) ? styles.button : styles.buttonSecondary}>
              {stars(r)}
            </Link>
          ))}
          <Link href={filterLink('/admin/reviews', params, { source: 'GOOGLE' })} className={params.source === 'GOOGLE' ? styles.button : styles.buttonSecondary}>Google</Link>
          <Link href={filterLink('/admin/reviews', params, { source: 'MANUAL' })} className={params.source === 'MANUAL' ? styles.button : styles.buttonSecondary}>Manual</Link>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Source</th>
                <th>Date</th>
                <th>Featured</th>
                <th>Published</th>
                <th>Order</th>
                <th>Last synced</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={10}>No reviews match these filters.</td>
                </tr>
              )}
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    {review.reviewerName}
                    {review.isSampleData && <span className={`${styles.badge} ${styles.badgeWarn}`}> SAMPLE DATA</span>}
                  </td>
                  <td aria-label={`${review.rating} out of 5 stars`}>{stars(review.rating)}</td>
                  <td style={{ maxWidth: '320px' }}>{review.reviewText.length > 140 ? `${review.reviewText.slice(0, 140)}…` : review.reviewText}</td>
                  <td>{review.source}</td>
                  <td>{formatDate(review.reviewDate)}</td>
                  <td><span className={`${styles.badge} ${review.featured ? styles.badgeActive : styles.badgeMuted}`}>{review.featured ? 'Featured' : '—'}</span></td>
                  <td><span className={`${styles.badge} ${review.published ? styles.badgeActive : styles.badgeMuted}`}>{review.published ? 'Published' : 'Hidden'}</span></td>
                  <td>{review.displayOrder}</td>
                  <td>{review.lastSyncedAt ? formatDate(review.lastSyncedAt) : '—'}</td>
                  <td>
                    <div className={styles.buttonRow}>
                      {(review.sourceUrl ?? review.office.googleBusinessProfileUrl) && (
                        <a href={review.sourceUrl ?? review.office.googleBusinessProfileUrl ?? '#'} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                          Open on Google
                        </a>
                      )}
                      <ReviewRowActions reviewId={review.id} featured={review.featured} published={review.published} displayOrder={review.displayOrder} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
