import type { DocumentMeta } from '../../data/documents';
import { DocumentPreview } from './DocumentPreview';
import { DocumentMetadata } from './DocumentMetadata';
import { DocumentDownloadButton } from './DocumentDownloadButton';
import styles from './DownloadCard.module.css';

interface DownloadCardProps {
  document: DocumentMeta;
  className?: string | undefined;
  layout?: 'vertical' | 'horizontal';
}

export function DownloadCard({ document, className = '', layout = 'horizontal' }: DownloadCardProps) {
  return (
    <div className={`${styles.card} ${styles[layout]} ${className}`}>
      <div className={styles.previewContainer}>
        <DocumentPreview document={document} />
      </div>
      
      <div className={styles.contentContainer}>
        <h3 className={styles.title}>{document.title}</h3>
        <p className={styles.description}>{document.description}</p>
        
        <DocumentMetadata document={document} className={styles.metadata} />
        
        <div className={styles.actions}>
          <DocumentDownloadButton document={document} variant="primary" />
          {document.fileType === 'PDF' && (
             <a 
               href={document.downloadUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className={styles.viewOnlineLink}
             >
               View Online
             </a>
          )}
        </div>
      </div>
    </div>
  );
}
