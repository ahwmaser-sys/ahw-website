'use client';

import { useState } from 'react';
import styles from './portal-ui.module.css';

interface Props {
  kind: 'documents' | 'photos' | 'media' | 'graphics';
  assetId: string;
  label: string;
}

// Documents/photos are never linked to directly (see C3's signed-URL
// work) — this fetches a fresh short-lived token from the signed-url
// endpoint, then navigates to it, on every click.
export function AssetDownloadLink({ kind, assetId, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${kind}/${assetId}/signed-url`);
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null);
        const message =
          body && typeof body === 'object' && 'error' in body && typeof (body as { error?: unknown }).error === 'string'
            ? (body as { error: string }).error
            : 'Could not open this file.';
        setError(message);
        return;
      }
      const data = (await res.json()) as { url: string };
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Could not open this file.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={handleClick} disabled={loading} className={styles.linkButton}>
        {loading ? 'Opening…' : label}
      </button>
      {error && <span className={styles.errorMessage}> {error}</span>}
    </span>
  );
}
