'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './TheDatum.module.css';

interface RegisterItem {
  number: string;
  name: string;
  proposition: string;
}

interface RegisterStackProps {
  items: RegisterItem[];
}

export const RegisterStack: React.FC<RegisterStackProps> = ({ items }) => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {setInView(true);}
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.registerStack} ref={containerRef}>
      <div className={styles.registerContent}>
        {items.map((item, index) => (
          <div key={item.number} className={`${styles.registerItem} ${inView ? styles.inView : ''}`} style={{ transitionDelay: `${index * 0.15}s` }}>
            <div className={styles.registerNumber}>{item.number}</div>
            <div className={styles.registerTextContainer}>
              <h3 className={styles.registerName}>{item.name}</h3>
              <p className={styles.registerProposition}>{item.proposition}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
