import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './status.module.css';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className={styles.main}>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>This page hasn&rsquo;t been designed yet.</h1>
      <p className={styles.description}>
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        Explore our completed projects or get in touch to start a conversation.
      </p>
      <div className={styles.actions}>
        <Link href="/" className={styles.primaryAction}>
          Back to Home
        </Link>
        <Link href="/projects" className={styles.secondaryAction}>
          View Projects →
        </Link>
      </div>
    </main>
  );
}
