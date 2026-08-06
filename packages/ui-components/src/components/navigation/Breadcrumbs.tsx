import React from 'react';
import Link from 'next/link';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Use "onDark" when the breadcrumb sits over a photo/fixed-dark hero
   * whose container already sets a fixed light `color` (inherited). */
  variant?: 'auto' | 'onDark';
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[], baseUrl = 'https://ahwspaces.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${baseUrl}${item.href}` } : {}),
    })),
  };
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, variant = 'auto' }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`${styles.breadcrumbs} ${variant === 'onDark' ? styles.onDark : ''}`}
    >
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={styles.item}>
              {item.href && !isLast ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && <span className={styles.separator}>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
