'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Review } from '@prisma/client';
import styles from './ClientReviewsSection.module.css';

export interface ClientReviewsSectionProps {
  reviews: Review[];
  aggregate: { averageRating: number; totalCount: number } | null;
  googleUrl: string | null;
  // Admin-controlled (Settings → Reviews) — gates only the "N Google
  // reviews" text below, never the rating, attribution, or cards
  // themselves. See shouldShowReviewCount in lib/portal/reviews/queries.ts.
  showCount: boolean;
}

function stars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

function formatReviewDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

// Real Google "G" brand marks, inlined as a static SVG — no icon font, no
// external request, no new dependency. Kept small and monochrome-adjacent
// in weight (14px) precisely so attribution stays identifiable without
// competing with AHW's own typography, per this section's trust-hierarchy
// requirement (client experience first, Google attribution second).
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true" className={styles.googleMark}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.96H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.04l3.01-2.34Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.96l3.01 2.34C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

const TRUNCATE_AT = 220;

function ReviewCard({ review, featured }: { review: Review; featured: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.reviewText.length > TRUNCATE_AT;
  const displayText = expanded || !isLong ? review.reviewText : `${review.reviewText.slice(0, TRUNCATE_AT).trimEnd()}…`;

  return (
    <article className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}>
      <span className={styles.quoteMark} aria-hidden="true">&ldquo;</span>
      <span className={styles.cardStars} aria-label={`${review.rating} out of 5 stars`}>
        {stars(review.rating)}
      </span>
      {/* Rendered as plain text, never dangerouslySetInnerHTML — Google
          review content is untrusted external input. */}
      <p className={styles.cardText}>{displayText}</p>
      {isLong && (
        <button type="button" className={styles.readMore} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      <div className={styles.reviewerRow}>
        {review.reviewerPhotoUrl ? (
          <Image src={review.reviewerPhotoUrl} alt="" width={32} height={32} className={styles.reviewerPhoto} unoptimized />
        ) : (
          <span className={styles.reviewerInitial} aria-hidden="true">
            {review.reviewerName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className={styles.reviewerMeta}>
          <span className={styles.reviewerName}>{review.reviewerName}</span>
          <span className={styles.reviewerDate}>{formatReviewDate(review.reviewDate)}</span>
        </span>
      </div>
    </article>
  );
}

// Server-rendered from our own database (see app/page.tsx) — never
// fetches Google directly, never renders while waiting on a live API
// call. Empty state (no featured+published reviews yet) renders nothing
// rather than a placeholder, so an unconfigured/not-yet-curated section
// doesn't show a half-built block on a live site.
export function ClientReviewsSection({ reviews, aggregate, googleUrl, showCount }: ClientReviewsSectionProps) {
  if (reviews.length === 0) return null;

  // A single, wider "lead" card breaks up what would otherwise be a
  // uniform testimonial grid — purely a CSS column-span on the first
  // card, no reordering of the underlying data (still each office's own
  // admin-chosen displayOrder). Only applied with enough reviews either
  // side of it to avoid an awkward lone remainder row.
  const useFeaturedLayout = reviews.length >= 4;

  return (
    <section className={styles.section} aria-labelledby="client-reviews-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Client Experiences</span>
          <h2 className={styles.title} id="client-reviews-heading">What Our Clients Say</h2>
          {aggregate && (
            <div className={styles.trustRow}>
              <span className={styles.googleAttribution}>
                <GoogleMark />
                Google
              </span>
              <span className={styles.trustDivider} aria-hidden="true">·</span>
              <span className={styles.ratingStars} aria-hidden="true">{stars(aggregate.averageRating)}</span>
              <span className={styles.ratingText}>
                {showCount
                  ? `${aggregate.averageRating.toFixed(1)}/5 — ${aggregate.totalCount} review${aggregate.totalCount === 1 ? '' : 's'}`
                  : `${aggregate.averageRating.toFixed(1)}/5`}
              </span>
              {googleUrl && (
                <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={styles.ratingLink}>
                  View all reviews on Google
                </a>
              )}
            </div>
          )}
        </div>

        <div className={styles.grid}>
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} featured={useFeaturedLayout && index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
