import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Publication } from '../../data/publications';
import styles from './PublicationCard.module.css';

export interface PublicationCardProps {
  publication: Publication;
  featured?: boolean;
  priority?: boolean;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({ publication, featured = false, priority = false }) => {
  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      {publication.coverImage && (
        <div className={styles.imageWrapper}>
          <Link href={`/insights/publications/${publication.slug}`} className={styles.imageLink}>
            <Image
              src={publication.coverImage}
              alt={publication.title}
              fill
              priority={priority}
              fetchPriority={priority ? 'high' : undefined}
              sizes="(max-width: 768px) 100vw, 33vw"
              className={styles.image}
            />
          </Link>
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.outlet}>{publication.outlet}</span>
          <span className={styles.separator}>—</span>
          <span className={styles.date}>{new Date(publication.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <Link href={`/insights/publications/${publication.slug}`} className={styles.titleLink}>
          <h2 className={styles.title}>{publication.title}</h2>
        </Link>
        <p className={styles.excerpt}>{publication.excerpt}</p>
        <div className={styles.footer}>
          {publication.readingTime && <span className={styles.readingTime}>{publication.readingTime}</span>}
          <Link href={`/insights/publications/${publication.slug}`} className={styles.readMore}>
            Read Article
          </Link>
        </div>
      </div>
    </article>
  );
};
