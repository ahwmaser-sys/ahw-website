'use client';

import { useEffect, useState } from 'react';
import styles from './portal-ui.module.css';

interface Props {
  assetId: string;
  alt: string;
  dominantColors?: string[];
}

// Fetches a signed URL for the asset and renders it as an <img> — the
// Media Library grid's actual thumbnail, not just a color swatch. Falls
// back to the asset's stored dominant-color swatch while loading or if
// the fetch fails, so the grid never shows a broken-image icon.
export function MediaThumbnail({ assetId, alt, dominantColors }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/portal/media/${assetId}/signed-url`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((data: { url: string }) => {
        if (!cancelled) setSrc(data.url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static/optimizable local path
    return <img src={src} alt={alt} className={styles.mediaThumbnailImg} />;
  }

  return (
    <div className={styles.mediaThumbnailFallback} aria-hidden="true">
      {(dominantColors ?? []).slice(0, 4).map((color, i) => (
        <span key={i} style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}
