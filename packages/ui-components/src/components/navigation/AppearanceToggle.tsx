'use client';

import { useEffect, useState } from 'react';
import styles from './AppearanceToggle.module.css';

export function AppearanceToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load initial theme from localStorage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem('ahw-theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('ahw-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (!mounted) return null;

  return (
    <div className={styles.wrapper}>
      <button 
        className={styles.toggleButton} 
        onClick={toggleTheme}
        aria-label="Toggle Appearance"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        <div className={`${styles.indicator} ${theme === 'light' ? styles.isLight : ''}`} />
      </button>
    </div>
  );
}
