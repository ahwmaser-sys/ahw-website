import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { NewsItem } from '../../data/news';
import styles from './NewsCard.module.css';

export interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  return (
    <article className={styles.card}>
      {news.coverImage && (
        <div className={styles.imageWrapper}>
          <Link href={`/insights/news/${news.slug}`}>
            <Image
              src={news.coverImage}
              alt={news.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className={styles.image}
              loading="lazy"
            />
          </Link>
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.date}>{new Date(news.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          {news.tags && news.tags.length > 0 && (
            <>
              <span className={styles.separator}>—</span>
              <span className={styles.tag}>{news.tags[0]}</span>
            </>
          )}
        </div>
        <Link href={`/insights/news/${news.slug}`} className={styles.titleLink}>
          <h2 className={styles.title}>{news.title}</h2>
        </Link>
        <p className={styles.excerpt}>{news.excerpt}</p>
        <div className={styles.footer}>
          {news.readingTime && <span className={styles.readingTime}>{news.readingTime}</span>}
          <Link href={`/insights/news/${news.slug}`} className={styles.readMore}>
            Read Article
          </Link>
        </div>
      </div>
    </article>
  );
};
