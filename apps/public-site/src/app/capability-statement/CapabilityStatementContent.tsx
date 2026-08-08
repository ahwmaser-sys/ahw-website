'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  buildTelLink,
  NativeReveal,
  Breadcrumbs,
  StructuredData,
  buildBreadcrumbJsonLd,
  Lightbox,
  DownloadCard,
  getDocumentById,
  type Office,
} from '@agp/ui-components';
import {
  firmOverview,
  firmPromise,
  stats,
  whyAhw,
  services,
  audiences,
  approach,
  designBuildComparison,
  qualityAssurance,
  clients,
  clientExpectations,
  projectsSectionTitle,
  projectsSectionNote,
  featuredWork,
  coverImage,
  firmImage,
} from './content';
import type { CapabilityQrCode, OfficeQrCodes } from './qrcodes';
import styles from './CapabilityStatement.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Capability Statement' },
];

interface CapabilityStatementContentProps {
  // Real offices, fetched from the database by page.tsx and passed down
  // — pre-sorted by the office's own admin-editable sortOrder. Renders
  // one contact block per office, however many exist.
  offices: readonly Office[];
  siteUrl: string;
  websiteQr: CapabilityQrCode | null;
  officeQrCodes: readonly OfficeQrCodes[];
}

export function CapabilityStatementContent({ offices, siteUrl, websiteQr, officeQrCodes }: CapabilityStatementContentProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const capabilityDoc = getDocumentById('capabilityStatement');
  const galleryImages = featuredWork.map((w) => w.image);
  const codesFor = (officeId: string) => officeQrCodes.find((q) => q.officeId === officeId)?.codes ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Capability Statement | AHW Architects',
    url: `${siteUrl}/capability-statement`,
  };

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={coverImage}
            alt="AHW Architects — interior architecture"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className={styles.heroImage}
          />
          <div className={styles.heroScrim} />
        </div>
        <div className={styles.heroContent}>
          <Breadcrumbs items={breadcrumbs} variant="onDark" />
          <NativeReveal behavior="fade" as="span" className={styles.heroKicker}>
            Design &middot; Build &middot; Deliver
          </NativeReveal>
          <NativeReveal behavior="wipe" as="h1" className={styles.heroTitle}>
            Capability<br />Statement
          </NativeReveal>
          <NativeReveal behavior="fade" delay={0.2} as="p" className={styles.heroTag}>
            An executive overview for developers, corporate clients, and delivery partners.
          </NativeReveal>
          <NativeReveal behavior="fade" delay={0.35} className={styles.heroActions}>
            {capabilityDoc && (
              <a href={capabilityDoc.downloadUrl} className={styles.heroCta} download>
                Download PDF
              </a>
            )}
            <span className={styles.heroScroll}>Scroll to explore</span>
          </NativeReveal>
        </div>
      </section>

      {/* ── ABOUT AHW ── */}
      <section className={styles.intro}>
        <div className={styles.introGrid}>
          <NativeReveal behavior="fade" className={styles.introText}>
            <span className={styles.eyebrow}>About AHW</span>
            <h2 className={styles.h2}>Better projects,<br />not just better buildings.</h2>
            <p className={styles.lead}>{firmOverview}</p>
            <p className={styles.body}>{firmPromise}</p>
          </NativeReveal>
          <NativeReveal behavior="aperture" delay={0.15} className={styles.introImageWrap}>
            <Image
              src={firmImage}
              alt="AHW Architects studio interior, Cairo"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className={styles.introImage}
              loading="lazy"
            />
          </NativeReveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className={styles.statsSection}>
        <div className={styles.statsBand}>
          {stats.map((s, i) => (
            <NativeReveal key={s.label} behavior="fade" delay={i * 0.08} className={styles.statItem}>
              {'todo' in s && s.todo ? (
                <>
                  <span className={`${styles.statValue} ${styles.statValueTodo}`}>—</span>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statTodoTag}>Owner to confirm</span>
                </>
              ) : (
                <>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </>
              )}
            </NativeReveal>
          ))}
        </div>
      </section>

      {/* ── WHY CLIENTS CHOOSE AHW ── */}
      <section className={styles.why}>
        <NativeReveal behavior="wipe" as="span" className={styles.eyebrow}>Why Clients Choose AHW</NativeReveal>
        <NativeReveal behavior="fade" as="h2" delay={0.1} className={styles.h2}>
          A single team, accountable<br />for the whole outcome.
        </NativeReveal>
        <div className={styles.whyGrid}>
          {whyAhw.map((w, i) => (
            <NativeReveal key={w.title} behavior="fade" delay={i * 0.05} className={styles.whyItem}>
              <h3 className={styles.whyTitle}>{w.title}</h3>
              <p className={styles.whyDesc}>{w.desc}</p>
            </NativeReveal>
          ))}
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className={styles.practice}>
        <NativeReveal behavior="wipe" as="span" className={styles.eyebrow}>What We Do</NativeReveal>
        <NativeReveal behavior="fade" as="h2" delay={0.1} className={styles.h2}>Six disciplines,<br />one accountable team.</NativeReveal>
        <div className={styles.servicesGrid}>
          {services.map((s, i) => (
            <NativeReveal key={s.title} behavior="fade" delay={i * 0.06} className={styles.serviceCard}>
              <h3 className={styles.serviceTitle}>{s.title}</h3>
              <p className={styles.serviceDesc}>{s.desc}</p>
            </NativeReveal>
          ))}
        </div>
        <div className={styles.audiencesWrap}>
          <span className={styles.eyebrowSmall}>Who We Work With</span>
          <div className={styles.audiencesRow}>
            {audiences.map((a) => (
              <span key={a} className={styles.audienceChip}>{a}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR APPROACH ── */}
      <section className={styles.methodSection}>
        <NativeReveal behavior="wipe" as="span" className={styles.eyebrowLight}>Our Approach</NativeReveal>
        <NativeReveal behavior="fade" as="h2" delay={0.1} className={styles.h2Light}>
          A rigorous, repeatable process.
        </NativeReveal>
        <div className={styles.methodList}>
          {approach.map((m, i) => (
            <NativeReveal key={m.number} behavior="fade" delay={(i % 3) * 0.08} className={styles.methodItem}>
              <span className={styles.methodNumber}>{m.number}</span>
              <div>
                <h3 className={styles.methodTitle}>{m.title}</h3>
                <p className={styles.methodDesc}>{m.desc}</p>
              </div>
            </NativeReveal>
          ))}
        </div>
      </section>

      {/* ── WHY DESIGN & BUILD ── */}
      <section className={styles.compare}>
        <NativeReveal behavior="wipe" as="span" className={styles.eyebrow}>{designBuildComparison.headline}</NativeReveal>
        <NativeReveal behavior="fade" as="p" delay={0.1} className={styles.compareIntro}>{designBuildComparison.intro}</NativeReveal>
        <div className={styles.compareGrid}>
          <NativeReveal behavior="fade" className={styles.compareCol}>
            <span className={styles.compareLabel}>{designBuildComparison.traditional.label}</span>
            <div className={styles.compareFlow}>
              {designBuildComparison.traditional.steps.map((step) => (
                <div key={step} className={styles.compareStep}>{step}</div>
              ))}
            </div>
            <div className={`${styles.compareOutcome} ${styles.compareOutcomeBad}`}>{designBuildComparison.traditional.outcome}</div>
          </NativeReveal>
          <NativeReveal behavior="fade" delay={0.1} className={styles.compareCol}>
            <span className={styles.compareLabel}>{designBuildComparison.ahw.label}</span>
            <div className={styles.compareFlow}>
              {designBuildComparison.ahw.steps.map((step) => (
                <div key={step} className={`${styles.compareStep} ${styles.compareStepGood}`}>{step}</div>
              ))}
            </div>
            <div className={`${styles.compareOutcome} ${styles.compareOutcomeGood}`}>{designBuildComparison.ahw.outcome}</div>
          </NativeReveal>
        </div>
      </section>

      {/* ── QUALITY ASSURANCE & RISK MANAGEMENT ── */}
      <section className={styles.qa}>
        <NativeReveal behavior="wipe" as="span" className={styles.eyebrow}>Quality Assurance &amp; Risk Management</NativeReveal>
        <NativeReveal behavior="fade" as="h2" delay={0.1} className={styles.h2}>
          Discipline that protects<br />the investment.
        </NativeReveal>
        <div className={styles.qaGrid}>
          {qualityAssurance.map((q, i) => (
            <NativeReveal key={q.title} behavior="fade" delay={i * 0.05} className={styles.qaItem}>
              <h3 className={styles.qaTitle}>{q.title}</h3>
              <p className={styles.qaDesc}>{q.desc}</p>
            </NativeReveal>
          ))}
        </div>
      </section>

      {/* ── REPRESENTATIVE PROJECTS ── */}
      <section className={styles.work}>
        <div className={styles.workHead}>
          <NativeReveal behavior="wipe" as="span" className={styles.eyebrow}>{projectsSectionTitle}</NativeReveal>
          <NativeReveal behavior="fade" as="h2" delay={0.1} className={styles.h2}>
            A selection of recent work.
          </NativeReveal>
          <NativeReveal behavior="fade" delay={0.15} as="p" className={styles.workNote}>{projectsSectionNote}</NativeReveal>
        </div>
        <div className={styles.workGrid}>
          {featuredWork.map((w, i) => (
            <NativeReveal
              key={w.slug}
              behavior="fade"
              delay={(i % 3) * 0.08}
              className={`${styles.workItem} ${w.orientation === 'portrait' ? styles.workItemTall : ''}`}
            >
              <button
                type="button"
                className={styles.workButton}
                onClick={() => setLightboxIndex(i)}
                aria-label={`Expand image: ${w.title}`}
              >
                <Image
                  src={w.image}
                  alt={w.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className={styles.workImage}
                  loading="lazy"
                />
                <div className={styles.workCaption}>
                  <h3 className={styles.workTitle}>{w.title}</h3>
                  <p className={styles.workMeta}>{w.sector} &middot; {w.location} &middot; {w.stat}</p>
                </div>
              </button>
            </NativeReveal>
          ))}
        </div>
        {lightboxIndex !== null && (
          <Lightbox
            images={galleryImages}
            alt={featuredWork[lightboxIndex]?.title || 'Project image'}
            index={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </section>

      {/* ── TRUSTED BY + WHAT CLIENTS CAN EXPECT ── */}
      <section className={styles.trusted}>
        <NativeReveal behavior="wipe" as="span" className={styles.eyebrow}>Trusted By</NativeReveal>
        <div className={styles.clientRow}>
          {clients.map((c, i) => (
            <NativeReveal key={c} behavior="fade" delay={i * 0.05} as="span" className={styles.clientName}>
              {c}
            </NativeReveal>
          ))}
        </div>

        <div className={styles.expectHead}>
          <NativeReveal behavior="wipe" as="span" className={styles.eyebrow}>What Clients Can Expect</NativeReveal>
        </div>
        <div className={styles.expectGrid}>
          {clientExpectations.map((e, i) => (
            <NativeReveal key={e.title} behavior="fade" delay={i * 0.05} className={styles.expectItem}>
              <h3 className={styles.expectTitle}>{e.title}</h3>
              <p className={styles.expectDesc}>{e.desc}</p>
            </NativeReveal>
          ))}
        </div>
      </section>

      {/* ── CONTACT + DOWNLOAD ── */}
      <section className={styles.closing}>
        <div className={styles.closingHead}>
          <NativeReveal behavior="wipe" as="span" className={styles.eyebrowLight}>Let&apos;s Talk</NativeReveal>
          <NativeReveal behavior="fade" as="h2" delay={0.1} className={styles.closingTitle}>
            Let&apos;s discuss<br />your next project.
          </NativeReveal>
        </div>

        <div className={styles.contactGrid}>
          {offices.map((office) => {
            const codes = codesFor(office.id);
            return (
              <div key={office.id} className={styles.officeBlock}>
                <h3 className={styles.officeTitle}>
                  {office.displayName}
                  {office.isHeadquarters && <span className={styles.hqTag}>Head Office</span>}
                </h3>
                <p className={styles.officeAddress}>{office.address.full}</p>
                <div className={styles.officeContacts}>
                  {office.contact.phones.map((phone) => (
                    <a key={phone} href={buildTelLink(phone)} className={styles.officeLine}>{phone}</a>
                  ))}
                  <a href={`mailto:${office.contact.primaryEmail}`} className={styles.officeLine}>{office.contact.primaryEmail}</a>
                </div>
                {codes.length > 0 && (
                  <div className={styles.officeQrRow}>
                    {codes.map((qr) => (
                      <div key={qr.label} className={styles.officeQr}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- generated server-side as a data URI, not an optimizable static asset */}
                        <img src={qr.dataUri} alt={`QR code — ${office.displayName} ${qr.label}`} className={styles.officeQrImage} />
                        <span className={styles.officeQrLabel}>{qr.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {websiteQr && (
          <div className={styles.qrRow}>
            <div className={styles.qrItem}>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated server-side as a data URI, not an optimizable static asset */}
              <img src={websiteQr.dataUri} alt="QR code linking to the AHW Architects website" className={styles.qrImage} />
              <span className={styles.qrLabel}>{websiteQr.label}</span>
            </div>
          </div>
        )}

        {capabilityDoc && (
          <div className={styles.downloadWrap}>
            <DownloadCard document={capabilityDoc} layout="horizontal" />
          </div>
        )}

        <Link href="/contact" className={styles.closingCta}>Start a conversation &rarr;</Link>
      </section>
    </main>
  );
}
