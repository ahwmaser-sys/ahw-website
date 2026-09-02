import Image from 'next/image';
import styles from './ArticleByline.module.css';

export interface ArticleBylineAuthor {
  name: string;
  jobTitle?: string;
  avatarUrl?: string;
}

export interface ArticleBylineProps {
  author?: ArticleBylineAuthor;
  date: string;
  readingTime?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function ArticleByline({ author, date, readingTime }: ArticleBylineProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={styles.byline}>
      {author && (
        <>
          {author.avatarUrl ? (
            <div className={styles.avatarWrapper}>
              <Image src={author.avatarUrl} alt={author.name} fill sizes="40px" className={styles.avatar} />
            </div>
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {initials(author.name)}
            </span>
          )}
        </>
      )}
      <div className={styles.details}>
        {author && (
          <span className={styles.name}>
            By <strong>{author.name}</strong>
            {author.jobTitle && <span className={styles.jobTitle}> — {author.jobTitle}</span>}
          </span>
        )}
        <span className={styles.meta}>
          <time dateTime={date}>{formattedDate}</time>
          {readingTime && (
            <>
              <span className={styles.separator}>—</span>
              <span>{readingTime}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
