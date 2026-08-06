'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './status.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className={styles.main}>
      <span className={styles.code}>500</span>
      <h1 className={styles.title}>Something went wrong on our end.</h1>
      <p className={styles.description}>
        We&rsquo;ve been notified and are looking into it. In the meantime, try
        again or head back to the homepage.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={reset} className={styles.primaryAction}>
          Try Again
        </button>
        <Link href="/" className={styles.secondaryAction}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
