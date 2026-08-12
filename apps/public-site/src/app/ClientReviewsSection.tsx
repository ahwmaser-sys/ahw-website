'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Review } from '@prisma/client';
import styles from './ClientReviewsSection.module.css';

export interface ClientReviewsSectionProps {
  reviews: Review[];
  aggregate: { averageRating: number; totalCount: number } | null;
  googleUrl: string | null;
}

function stars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

function formatReviewDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

const TRUNCATE_AT = 220;

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.reviewText.length > TRUNCATE_AT;
  const displayText = expanded || !isLong ? review.reviewText : `${review.reviewText.slice(0, TRUNCATE_AT).trimEnd()}…`;

  return (
    <article className={styles.card}>
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
          <Image src={review.reviewerPhotoUrl} alt="" width={36} height={36} className={styles.reviewerPhoto} unoptimized />
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
export function ClientReviewsSection({ reviews, aggregate, googleUrl }: ClientReviewsSectionProps) {
  if (reviews.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="client-reviews-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Client Experiences</span>
          <h2 className={styles.title} id="client-reviews-heading">What Our Clients Say</h2>
          {aggregate && (
            <div className={styles.ratingRow}>
              <span className={styles.ratingStars} aria-hidden="true">{stars(aggregate.averageRating)}</span>
              <span className={styles.ratingText}>
                {aggregate.averageRating.toFixed(1)} out of 5 — based on {aggregate.totalCount} Google review{aggregate.totalCount === 1 ? '' : 's'}
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
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
