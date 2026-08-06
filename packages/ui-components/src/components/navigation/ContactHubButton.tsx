'use client';

import type { Ref } from 'react';
import { MessageSquareIcon, CloseIcon } from './contactHubIcons';
import styles from './ContactHubButton.module.css';

interface ContactHubButtonProps {
  isOpen: boolean;
  onClick: () => void;
  menuId: string;
  ref?: Ref<HTMLButtonElement>;
}

export function ContactHubButton({ isOpen, onClick, menuId, ref }: ContactHubButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={styles.button}
      aria-label={isOpen ? 'Close contact options' : 'Open contact options'}
      aria-expanded={isOpen}
      aria-controls={menuId}
    >
      <span className={styles.iconSwap}>
        <MessageSquareIcon className={`${styles.icon} ${isOpen ? styles.iconHidden : styles.iconVisible}`} />
        <CloseIcon className={`${styles.icon} ${isOpen ? styles.iconVisible : styles.iconHidden}`} />
      </span>
      <span className={styles.label}>{isOpen ? 'Close' : "Let's Talk"}</span>
    </button>
  );
}
