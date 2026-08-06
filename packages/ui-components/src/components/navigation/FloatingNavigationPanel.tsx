'use client';

import React from 'react';
import styles from './FloatingNavigationPanel.module.css';
import { projects } from '../../data/projects';
import { isCommercialSector } from '../../data/sectorTaxonomy';

interface FloatingNavigationPanelProps {
  id?: string;
  isOpen: boolean;
  onHoverSection?: (sectionLabel: string | null) => void;
}

// Derived from the live project data, not hardcoded — a sector/market with
// zero matching projects structurally cannot appear here, and a new sector
// added to the data shows up in the nav automatically.
const sectorsInUse = Array.from(new Set(projects.map((p) => p.sector))).sort();
const marketsInUse = Array.from(new Set(projects.map((p) => p.market))).sort();

// "Featured" is the project data's own explicit tier flag (never array
// order or recency) — every project already carries an editorial
// Flagship/Standard call, so this reuses that signal instead of inventing
// a second one.
const featuredProjects = projects.filter((p) => p.tier === 'Flagship');

const navData = [
  {
    label: 'Projects',
    path: '/projects',
    groups: [
      {
        groupLabel: 'Featured',
        items: featuredProjects.map((p) => ({ label: p.title, path: `/projects/${p.slug}` })),
      },
      {
        // Two-level: Residential stays flat; Retail/Workplace/Hospitality
        // nest under a Commercial parent (see data/sectorTaxonomy.ts) —
        // derived from live data, so a sector with zero projects still
        // can't appear, and the grouping tracks whatever's actually in
        // projects.ts rather than a hardcoded list.
        groupLabel: 'Sector',
        items: [
          { label: 'All', path: '/projects?sector=all' },
          ...sectorsInUse.filter((s) => !isCommercialSector(s)).map((s) => ({ label: s, path: `/projects?sector=${s.toLowerCase()}` })),
          ...(sectorsInUse.some(isCommercialSector) ? [
            { label: 'Commercial', path: '/projects?sector=commercial' },
            ...sectorsInUse.filter(isCommercialSector).map((s) => ({ label: s, path: `/projects?sector=${s.toLowerCase()}`, child: true })),
          ] : []),
        ]
      },
      {
        groupLabel: 'Market',
        items: [
          { label: 'All', path: '/projects?market=all' },
          ...marketsInUse.map((m) => ({ label: m, path: `/projects?market=${m.toLowerCase()}` })),
        ]
      }
    ],
  },
  {
    label: 'Expertise',
    path: '/expertise',
    subitems: [
      { label: 'Architecture', path: '/expertise/architecture' },
      { label: 'Interior Design', path: '/expertise/interior-design' },
      { label: 'Design & Build', path: '/expertise/design-build' },
      { label: 'Fit-Out', path: '/expertise/fit-out' },
    ],
  },
  {
    label: 'Insights',
    path: '/insights',
    subitems: [
      { label: 'Publications', path: '/insights/publications' },
      { label: 'News', path: '/insights/news' },
    ],
  },
  {
    label: 'About',
    path: '/about',
    subitems: [
      { label: 'About Us', path: '/about/about-us' },
      { label: 'Why AHW', path: '/about/why-ahw' },
      { label: 'Careers', path: '/about/careers' },
    ],
  },
  {
    label: 'Contact',
    path: '/contact',
    subitems: [
      { label: 'Egypt Office', path: '/contact/egypt' },
      { label: 'Kuwait Office', path: '/contact/kuwait' },
      { label: 'General Inquiries', path: '/contact' },
    ],
  },
];

export const FloatingNavigationPanel: React.FC<FloatingNavigationPanelProps> = ({
  id,
  isOpen,
  onHoverSection
}) => {
  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      className={`${styles.navContainer} ${isOpen ? styles.open : ''}`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <ul className={styles.linkList}>
        {navData.map((item, index) => {
          const hasSub = !!item.subitems || !!item.groups;

          return (
            <li 
              key={item.label} 
              className={styles.linkItem}
              style={{ '--stagger-idx': index } as React.CSSProperties}
              onMouseEnter={() => onHoverSection?.(item.label)}
              onMouseLeave={() => onHoverSection?.(null)}
            >
              <div className={styles.primaryBlock}>
                <a 
                  href={item.path} 
                  className={styles.primaryLink} 
                >
                  <span className={styles.dot} />
                  <span className={styles.linkLabel}>{item.label}</span>
                </a>
                
                {hasSub && (
                  <div className={styles.sublistWrapper}>
                    <div className={styles.sublist}>
                      {item.groups ? (
                        item.groups.map(group => (
                          <div key={group.groupLabel} className={styles.navGroup}>
                            <div className={styles.groupLabel}>{group.groupLabel}</div>
                            <ul className={styles.groupItems}>
                              {group.items.map(sub => (
                                <li key={sub.label} className={`${styles.subItem} ${'child' in sub && sub.child ? styles.subItemChild : ''}`}>
                                  <span className={styles.lArrow}>↳</span>
                                  <a href={sub.path} className={styles.subLink}>
                                    {sub.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <ul className={styles.groupItems}>
                          {item.subitems?.map(sub => (
                            <li key={sub.label} className={styles.subItem}>
                              <span className={styles.lArrow}>↳</span>
                              <a href={sub.path} className={styles.subLink}>
                                {sub.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
