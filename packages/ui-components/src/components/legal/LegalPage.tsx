import React from 'react';
import { Breadcrumbs, type BreadcrumbItem } from '../navigation/Breadcrumbs';
import styles from './LegalPage.module.css';

export interface LegalSection {
  // Optional — a single-section page backed by one flat text field (e.g.
  // an Admin-editable LegalPage row) has nothing meaningful to head with;
  // omit it rather than render an empty <h2>.
  heading?: string;
  body: React.ReactNode;
}

export interface LegalPageProps {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
  breadcrumbs?: BreadcrumbItem[];
}

export const LegalPage: React.FC<LegalPageProps> = ({ title, lastUpdated, intro, sections, breadcrumbs }) => {
  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
          {intro && <p className={styles.intro}>{intro}</p>}
        </div>
      </section>

      <section className={styles.bodySection}>
        <div className={styles.container}>
          {sections.map((section, index) => (
            <div key={section.heading ?? index} className={styles.section}>
              {section.heading && <h2 className={styles.sectionHeading}>{section.heading}</h2>}
              <div className={styles.sectionBody}>{section.body}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
