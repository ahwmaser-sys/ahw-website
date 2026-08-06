import React from 'react';
import styles from './TheDatum.module.css';

interface ActCardProps {
  numeral: string;
  title: string;
  subtitle: string;
  actNumber: 1 | 2 | 3 | 4;
}

export const ActCard: React.FC<ActCardProps> = ({ numeral, title, subtitle, actNumber }) => {
  return (
    <div className={`${styles.actCard} ${styles[`act${actNumber}`]}`}>
      <div className={styles.actCardContent}>
        <div className={styles.actNumeral} aria-hidden="true">{numeral}</div>
        <div className={styles.actHeader}>
          <h2 className={styles.actTitle}>{title}</h2>
          <p className={styles.actSubtitle}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
