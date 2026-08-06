import React from 'react';
import Link from 'next/link';
import styles from './TheDatum.module.css';

interface HoldProps {
  imageSrc: string;
  text?: string;
  href?: string;
}

export const Hold: React.FC<HoldProps> = ({ imageSrc, text, href }) => {
  return (
    <div className={styles.holdContainer}>
      <div className={styles.holdBackground} style={{ backgroundImage: `url(${imageSrc})` }}></div>
      {text && (
        href ? (
          <Link href={href} className={styles.holdContent}>
            <p className={styles.holdText}>{text}</p>
          </Link>
        ) : (
          <div className={styles.holdContent}>
            <p className={styles.holdText}>{text}</p>
          </div>
        )
      )}
    </div>
  );
};
