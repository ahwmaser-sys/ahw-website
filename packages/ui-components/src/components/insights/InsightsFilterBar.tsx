'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './InsightsFilterBar.module.css';

export interface InsightsFilterBarProps {
  categories: string[];
  basePath: string; // e.g. '/insights/publications'
}

export const InsightsFilterBar: React.FC<InsightsFilterBarProps> = ({ categories, basePath }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get('tag') || 'All';
  const currentSearch = searchParams.get('q') || '';

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'All') {
      params.delete('tag');
    } else {
      params.set('tag', category);
    }
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim() === '') {
      params.delete('q');
    } else {
      params.set('q', query);
    }
    params.delete('page');
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.categories}>
        <button
          className={`${styles.categoryButton} ${currentCategory === 'All' ? styles.active : ''}`}
          onClick={() => handleCategoryClick('All')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryButton} ${currentCategory === cat ? styles.active : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      
      <div className={styles.searchWrapper}>
        <input
          type="text"
          placeholder="Search..."
          aria-label="Search insights"
          className={styles.searchInput}
          defaultValue={currentSearch}
          onChange={(e) => {
            // Debounce simple
            const timeoutId = setTimeout(() => handleSearchChange(e), 300);
            return () => clearTimeout(timeoutId);
          }}
        />
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>
  );
};
