import type { DocumentMeta } from '../../data/documents';
import styles from './DocumentMetadata.module.css';

interface DocumentMetadataProps {
  document: DocumentMeta;
  className?: string;
}

export function DocumentMetadata({ document, className = '' }: DocumentMetadataProps) {
  return (
    <div className={`${styles.metadata} ${className}`}>
      <div className={styles.metaItem}>
        <span className={styles.label}>Type</span>
        <span className={styles.value}>{document.fileType}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.label}>Size</span>
        <span className={styles.value}>{document.fileSize}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.label}>Version</span>
        <span className={styles.value}>{document.version}</span>
      </div>
      {document.lastUpdated && (
        <div className={styles.metaItem}>
          <span className={styles.label}>Updated</span>
          <span className={styles.value}>{document.lastUpdated}</span>
        </div>
      )}
    </div>
  );
}
