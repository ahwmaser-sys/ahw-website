'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './TheDatum.module.css';

export const TheSheet: React.FC = () => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) { setInView(true); }
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.sheetContainer} ref={containerRef}>
      <div className={styles.sheetContent}>
        <div className={`${styles.sheetTextGroup} ${inView ? styles.inView : ''}`}>
          <h1 className={styles.sheetText}>We are not sixteen services.</h1>
          <p className={styles.sheetText}>We are a single, continuous line of accountability.</p>
          <p className={styles.sheetText} style={{ marginTop: 'var(--space-8)', fontSize: 'var(--font-size-2xl)', color: 'var(--color-brand-stone)' }}>
            From master planning to turnkey construction.
          </p>
        </div>
      </div>
    </div>
  );
};
