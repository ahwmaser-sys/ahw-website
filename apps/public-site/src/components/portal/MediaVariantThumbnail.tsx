'use client';

import { useEffect, useState } from 'react';
import styles from './portal-ui.module.css';

export function MediaVariantThumbnail({ assetId, purpose, label }: { assetId: string; purpose: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/portal/media/${assetId}/signed-url?purpose=${encodeURIComponent(purpose)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((data: { url: string }) => {
        if (!cancelled) setSrc(data.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [assetId, purpose]);

  return (
    <div className={styles.card}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static/optimizable local path
        <img src={src} alt={label} className={styles.mediaThumbnailImg} />
      ) : (
        <div className={styles.mediaThumbnailFallback} />
      )}
      <span className={styles.cardMeta}>{label}</span>
    </div>
  );
}
