'use client';

import { useState } from 'react';
import styles from '../../../components/portal/portal-ui.module.css';

export function QrCodeGenerator({ defaultContent }: { defaultContent: string }) {
  const [content, setContent] = useState(defaultContent);
  const [src, setSrc] = useState<string | null>(null);

  function generate() {
    setSrc(`/api/portal/brand-kit/qrcode?content=${encodeURIComponent(content)}&t=${Date.now()}`);
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="qrContent">URL or text</label>
        <input className={styles.input} id="qrContent" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <button type="button" className={styles.button} onClick={generate}>Generate QR code</button>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- generated on demand, not a static/optimizable asset
        <img src={src} alt={`QR code for ${content}`} className={styles.qrPreview} />
      )}
    </div>
  );
}
