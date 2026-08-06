import React from 'react';
import styles from './PageLoading.module.css';

export const PageLoading: React.FC = () => {
  return (
    <div className={styles.wrapper} role="status" aria-label="Loading">
      <div className={styles.hero} />
      <div className={styles.container}>
        <div className={`${styles.line} ${styles.lineWide}`} />
        <div className={`${styles.line} ${styles.lineNarrow}`} />
        <div className={styles.grid}>
          <div className={styles.block} />
          <div className={styles.block} />
        </div>
      </div>
    </div>
  );
};
