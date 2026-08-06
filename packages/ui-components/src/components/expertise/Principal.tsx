import React from 'react';
import styles from './TheDatum.module.css';

interface PrincipalProps {
  number: string;
  name: string;
  statement: string;
  imageSrc: string;
}

export const Principal: React.FC<PrincipalProps> = ({ number, name, statement, imageSrc }) => {
  return (
    <div className={styles.principalContainer}>
      <div className={styles.principalBackground} style={{ backgroundImage: `url(${imageSrc})` }}></div>
      <div className={styles.principalContent}>
        <div className={styles.principalNumber}>{number}</div>
        <h2 className={styles.principalName}>{name}</h2>
        <p className={styles.principalStatement}>{statement}</p>
      </div>
    </div>
  );
};
