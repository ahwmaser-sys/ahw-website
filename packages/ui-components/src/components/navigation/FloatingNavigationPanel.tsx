'use client';

import React, { useEffect, useState } from 'react';
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
      { label: 'Engineering & Project Management', path: '/expertise/engineering-project-management' },
    ],
  },
  {
    label: 'Insights',
    path: '/insights',
    subitems: [
      { label: 'Publications', path: '/insights/publications' },
      { label: 'News', path: '/insights/news' },
      { label: 'Social', path: '/social' },
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

const slugify = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const FloatingNavigationPanel: React.FC<FloatingNavigationPanelProps> = ({
  id,
  isOpen,
  onHoverSection
}) => {
  // The one accordion state for the whole panel — identical on every
  // breakpoint. At most one top-level section is expanded at a time;
  // opening a sibling closes whichever was open. Desktop mouse users get
  // an extra `onMouseEnter` trigger that sets this same state (see
  // .primaryBlock below) so hovering still reveals a submenu without a
  // click, but it's the same state machine touch users drive by tapping
  // the disclosure button — not a separate desktop-only mechanism.
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Always start collapsed the next time the panel opens, rather than
  // re-showing whatever was expanded when it was last closed.
  useEffect(() => {
    if (!isOpen) setOpenSection(null);
  }, [isOpen]);

  const toggleSection = (label: string) => {
    setOpenSection((prev) => (prev === label ? null : label));
  };

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
          const sectionOpen = openSection === item.label;
          const sublistId = `${id || 'nav'}-sublist-${slugify(item.label)}`;

          return (
            <li
              key={item.label}
              className={styles.linkItem}
              style={{ '--stagger-idx': index } as React.CSSProperties}
              onMouseEnter={() => onHoverSection?.(item.label)}
              onMouseLeave={() => onHoverSection?.(null)}
            >
              <div
                className={styles.primaryBlock}
                onMouseEnter={hasSub ? () => setOpenSection(item.label) : undefined}
              >
                <div className={styles.primaryRow}>
                  <a
                    href={item.path}
                    className={styles.primaryLink}
                  >
                    <span className={styles.dot} />
                    <span className={styles.linkLabel}>{item.label}</span>
                  </a>

                  {hasSub && (
                    <button
                      type="button"
                      className={styles.disclosureTrigger}
                      aria-expanded={sectionOpen}
                      aria-controls={sublistId}
                      aria-label={`${sectionOpen ? 'Collapse' : 'Expand'} ${item.label} submenu`}
                      onClick={() => toggleSection(item.label)}
                    >
                      <span className={styles.chevron} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {hasSub && (
                  <div
                    id={sublistId}
                    className={styles.sublistWrapper}
                    data-open={sectionOpen}
                    inert={!sectionOpen}
                  >
                    <div className={styles.sublist}>
                      {item.groups ? (
                        item.groups.map(group => {
                          const groupHeadingId = `${sublistId}-${slugify(group.groupLabel)}-heading`;
                          return (
                            <div key={group.groupLabel} className={styles.navGroup}>
                              <div id={groupHeadingId} className={styles.groupLabel} role="heading" aria-level={3}>{group.groupLabel}</div>
                              <ul className={styles.groupItems} aria-labelledby={groupHeadingId}>
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
                          );
                        })
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
