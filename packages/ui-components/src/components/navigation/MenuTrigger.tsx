'use client';

import React from 'react';
import styles from './MenuTrigger.module.css';

interface MenuTriggerProps {
  isOpen: boolean;
  onClick: () => void;
  controlsId?: string;
}

export const MenuTrigger = React.forwardRef<HTMLButtonElement, MenuTriggerProps>(
  ({ isOpen, onClick, controlsId }, ref) => {
  return (
    <button
      ref={ref}
      className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
      onClick={onClick}
      aria-label={isOpen ? "Close Menu" : "Open Menu"}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-controls={controlsId}
    >
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
      >
        {/* 
          AHW Monogram Trigger
          Derived from the AHW logo geometry: An architectural 'H'.
          Two vertical pillars and a central beam that seamlessly morph into a Close (X).
        */}
        <rect 
          className={`${styles.line} ${styles.lineLeft}`} 
          x="12" y="10" width="2" height="20" 
          fill="currentColor"
        />
        <rect 
          className={`${styles.line} ${styles.lineMiddle}`} 
          x="14" y="19" width="12" height="2" 
          fill="currentColor"
        />
        <rect 
          className={`${styles.line} ${styles.lineRight}`} 
          x="26" y="10" width="2" height="20" 
          fill="currentColor"
        />
      </svg>
    </button>
  );
});

MenuTrigger.displayName = 'MenuTrigger';
