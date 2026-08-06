import Image from 'next/image';
import type { DocumentMeta } from '../../data/documents';
import styles from './DocumentPreview.module.css';

interface DocumentPreviewProps {
  document: DocumentMeta;
  className?: string;
}

export function DocumentPreview({ document, className = '' }: DocumentPreviewProps) {
  return (
    <div className={`${styles.previewWrapper} ${className}`}>
      {document.coverImage ? (
        <Image src={document.coverImage} alt={`${document.title} Cover`} fill sizes="(max-width: 768px) 50vw, 25vw" className={styles.cover} />
      ) : (
        <div className={styles.placeholderCover}>
          <div className={styles.documentIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={styles.fileType}>{document.fileType}</span>
        </div>
      )}
    </div>
  );
}
