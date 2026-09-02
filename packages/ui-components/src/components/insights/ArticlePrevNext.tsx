import Link from 'next/link';
import styles from './ArticlePrevNext.module.css';

export interface ArticlePrevNextItem {
  href: string;
  title: string;
}

export interface ArticlePrevNextProps {
  prev: ArticlePrevNextItem | null;
  next: ArticlePrevNextItem | null;
}

// No wraparound at the ends — same convention already established on
// /projects/[slug]: the first item shows nothing on the left, the last
// shows nothing on the right, rather than looping back around.
export function ArticlePrevNext({ prev, next }: ArticlePrevNextProps) {
  if (!prev && !next) return null;
  return (
    <nav className={styles.navSection} aria-label="Article navigation">
      {prev ? (
        <Link href={prev.href} className={styles.navLink}>
          ← {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className={styles.navLink}>
          {next.title} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
