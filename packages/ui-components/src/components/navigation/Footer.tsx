import type { Office } from '../../data/offices';
import { getAllDocuments } from '../../data/documents';
import { buildTelLink } from '../../lib/tel';
import { FooterSocialLinks } from './FooterSocialLinks';
import styles from './Footer.module.css';

interface FooterProps {
  // Real offices, fetched from the database and passed down by the app
  // (see apps/public-site/src/lib/portal/offices.ts) — pre-sorted by the
  // office's own admin-editable sortOrder, never a hardcoded "Egypt
  // first" rule. Renders however many offices exist, not exactly two.
  offices: readonly Office[];
  // Global Company copy (Settings → Brand → Footer settings) — a
  // sensible literal default only for the rare case the row hasn't been
  // seeded yet, never the source of truth itself.
  copyrightText?: string | undefined;
}

export function Footer({ offices, copyrightText }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const documents = getAllDocuments();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Oversized closing statement — the visual anchor — plus an
            explicit CTA button alongside it. */}
        <div className={styles.statement}>
          <a href="/contact" className={styles.statementLink}>
            Let&apos;s build your <em className={styles.statementEm}>next project</em>.
          </a>
          <a href="/contact" className={styles.cta}>Start Your Project</a>
        </div>

        {/* Everything else: subordinate to the statement, but every
            office stays at equal weight relative to the others — same
            render path for each, only the data differs. */}
        <div className={styles.subordinateGrid}>
          <div className={styles.officesRow}>
            {offices.map((office) => (
              <div key={office.id} className={styles.officeBlock}>
                <h2 className={styles.officeName}>
                  {office.displayName}
                  {office.isHeadquarters && <span className={styles.hqTag}>Head Office</span>}
                </h2>
                <p className={styles.officeAddress}>{office.address.full}</p>
                <div className={styles.officeContacts}>
                  {office.contact.phones.map((phone) => (
                    <a key={phone} href={buildTelLink(phone)} className={styles.officeContact}>{phone}</a>
                  ))}
                  <a href={`mailto:${office.contact.primaryEmail}`} className={styles.officeContact}>
                    {office.contact.primaryEmail}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.linksRow}>
            <div className={styles.linkGroup}>
              <h3 className={styles.groupTitle}>Company</h3>
              <a href="/about" className={styles.link}>About Us</a>
              <a href="/expertise" className={styles.link}>Expertise</a>
              <a href="/projects" className={styles.link}>Projects</a>
              <a href="/insights" className={styles.link}>Insights</a>
              <a href="/faq" className={styles.link}>FAQ</a>
              <a href="/contact" className={styles.link}>Contact</a>
              <a href="/client" className={styles.clientPortalLink}>
                Client Portal <span className={styles.clientPortalIcon} aria-hidden="true">&rarr;</span>
              </a>
            </div>

            <div className={styles.linkGroup}>
              <h3 className={styles.groupTitle}>Downloads</h3>
              {documents.map((doc) => (
                doc.isFuture ? (
                  <span key={doc.id} className={`${styles.link} ${styles.linkFuture}`}>
                    {doc.title} <span className={styles.comingSoon}>(Coming Soon)</span>
                  </span>
                ) : (
                  <a key={doc.id} href={doc.downloadUrl} className={styles.link} target="_blank" rel="noopener noreferrer">
                    {doc.title}
                  </a>
                )
              ))}
            </div>

            <div className={styles.linkGroup}>
              <h3 className={styles.groupTitle}>Social</h3>
              <FooterSocialLinks offices={offices} linkClassName={styles.link} />
            </div>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <img src="/images/logo-white.webp" alt="AHW Architects" className={`${styles.logo} ${styles.logoWhite}`} />
          <img src="/images/logo-dark.webp" alt="AHW Architects" className={`${styles.logo} ${styles.logoDark}`} />
          <p className={styles.copyright}>{copyrightText ?? `© ${currentYear} AHW Architects. All rights reserved.`}</p>
          <div className={styles.legalLinks}>
            <a href="/privacy-policy" className={styles.legalLink}>Privacy Policy</a>
            <a href="/terms-of-service" className={styles.legalLink}>Terms of Service</a>
            <a href="/cookie-policy" className={styles.legalLink}>Cookie Policy</a>
            <a href="/data-deletion" className={styles.legalLink}>Data Deletion</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
