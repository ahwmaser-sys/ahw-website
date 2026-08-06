import type { DocumentMeta } from '../../data/documents';
import styles from './DocumentDownloadButton.module.css';

interface DocumentDownloadButtonProps {
  document: DocumentMeta;
  className?: string;
  variant?: 'primary' | 'outline' | 'minimal';
}

export function DocumentDownloadButton({ document, className = '', variant = 'primary' }: DocumentDownloadButtonProps) {
  return (
    <a 
      href={document.downloadUrl} 
      download 
      target="_blank" 
      rel="noopener noreferrer"
      className={`${styles.button} ${styles[variant]} ${className}`}
      aria-label={`Download ${document.title}`}
    >
      <span className={styles.icon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span className={styles.text}>Download {document.fileType}</span>
    </a>
  );
}
