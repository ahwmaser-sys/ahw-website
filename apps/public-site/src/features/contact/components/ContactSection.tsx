'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildWhatsAppLink, TrackedPhoneLink, Breadcrumbs, buildBreadcrumbJsonLd, StructuredData, type Office } from '@agp/ui-components';
import { ContactForm } from './ContactForm';
import styles from './ContactSection.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Contact' },
];

interface ContactSectionProps {
  initialOfficeId?: string;
  // Real offices, fetched from the database and passed down by the page
  // — pre-sorted by the office's own admin-editable sortOrder. Renders
  // one tab per office, however many exist, never a fixed Egypt/Kuwait
  // pair.
  offices: readonly Office[];
  // This is a Client Component, so it can't call getSiteUrl() itself
  // (a server-only DB read) — the page passes down the same value it
  // already fetched for its own JSON-LD.
  siteUrl: string;
}

function resolveOfficeId(offices: readonly Office[], candidate: string | undefined): string {
  const fallback = offices[0]?.id || '';
  if (!candidate) return fallback;
  const match = offices.find((o) => o.id === candidate || (candidate === 'kw' && o.country === 'Kuwait'));
  return match?.id || fallback;
}

export function ContactSection({ initialOfficeId, offices: orderedOffices, siteUrl }: ContactSectionProps) {
  const router = useRouter();
  const [activeOfficeId, setActiveOfficeId] = useState(() => resolveOfficeId(orderedOffices, initialOfficeId));
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function activateOffice(officeId: string, updateUrl: boolean) {
    setActiveOfficeId(officeId);
    if (updateUrl) {
      // Shallow URL update so the tab is deep-linkable (?office=egypt)
      // without a full navigation/reload.
      router.replace(`/contact?office=${officeId}`, { scroll: false });
    }
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const ids = orderedOffices.map((o) => o.id);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % ids.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + ids.length) % ids.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = ids.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      const nextId = ids[nextIndex];
      if (nextId) {
        activateOffice(nextId, true);
        tabRefs.current[nextId]?.focus();
      }
    }
  }

  const activeOffice = orderedOffices.find((o) => o.id === activeOfficeId) || orderedOffices[0];

  return (
    <section className={styles.section}>
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <div className={styles.container}>
        <div className={styles.header}>
          <Breadcrumbs items={breadcrumbs} />
          <h1 className={styles.title}>Let&apos;s Build the Future Together.</h1>
        </div>

        <div className={styles.grid}>
          {/* Left Column: office tabs — equal visual weight, one active at a time */}
          <div className={styles.contextColumn}>
            <div className={styles.tablist} role="tablist" aria-label="Select an office">
              {orderedOffices.map((office, index) => {
                const isActive = office.id === activeOfficeId;
                return (
                  <button
                    key={office.id}
                    ref={(el) => { tabRefs.current[office.id] = el; }}
                    type="button"
                    role="tab"
                    id={`office-tab-${office.id}`}
                    aria-selected={isActive}
                    aria-controls={`office-panel-${office.id}`}
                    tabIndex={isActive ? 0 : -1}
                    className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                    onClick={() => activateOffice(office.id, true)}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                  >
                    {office.displayName}
                    {office.isHeadquarters && <span className={styles.hqTag}>HQ</span>}
                  </button>
                );
              })}
            </div>

            {activeOffice && (
              <div
                key={activeOffice.id}
                role="tabpanel"
                id={`office-panel-${activeOffice.id}`}
                aria-labelledby={`office-tab-${activeOffice.id}`}
                tabIndex={0}
                className={styles.officeBlock}
              >
                <div className={styles.contextInner}>
                  <div className={styles.infoBlock}>
                    <h2 className={styles.infoLabel}>Address</h2>
                    <p className={styles.infoText}>{activeOffice.address.building}</p>
                    <p className={styles.infoText}>{activeOffice.address.street}</p>
                    <p className={styles.infoText}>{activeOffice.address.city}, {activeOffice.country}</p>
                    <a
                      href={activeOffice.address.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      Open in Google Maps &#8599;
                    </a>
                  </div>

                  <div className={styles.infoBlock}>
                    <h2 className={styles.infoLabel}>Contact</h2>
                    {activeOffice.contact.phones.map((phone) => (
                      <p key={phone} className={styles.infoText}>
                        <TrackedPhoneLink
                          phone={phone}
                          className={styles.phoneLink}
                          ariaLabel={`${activeOffice.displayName} phone: ${phone}`}
                        />
                      </p>
                    ))}
                    <p className={styles.infoText}>
                      <a
                        href={`mailto:${activeOffice.contact.primaryEmail}`}
                        className={styles.emailLink}
                        aria-label={`${activeOffice.displayName} email: ${activeOffice.contact.primaryEmail}`}
                      >
                        {activeOffice.contact.primaryEmail}
                      </a>
                    </p>
                    {activeOffice.contact.whatsapp && (
                      <a
                        href={buildWhatsAppLink(activeOffice.contact.whatsapp, "Hi AHW Architects, I'd like to enquire about a project.")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.whatsappLink}
                      >
                        Chat on WhatsApp &#8599;
                      </a>
                    )}
                  </div>

                  <div className={styles.infoBlock}>
                    <h2 className={styles.infoLabel}>Working Hours</h2>
                    <p className={styles.infoText}>{activeOffice.workingHours}</p>
                    <p className={styles.timezone}>Timezone: {activeOffice.timezone}</p>
                  </div>
                </div>

                <div className={styles.mapWrapper}>
                  <a
                    href={activeOffice.address.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapOverlay}
                    aria-label={`Open ${activeOffice.displayName} on Google Maps`}
                  />
                  <iframe
                    src={activeOffice.address.embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className={styles.mapIframe}
                    title={`Map showing location of ${activeOffice.displayName}`}
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Action */}
          <div className={styles.actionColumn}>
            <ContactForm officeId={activeOfficeId} />
          </div>
        </div>
      </div>
    </section>
  );
}
