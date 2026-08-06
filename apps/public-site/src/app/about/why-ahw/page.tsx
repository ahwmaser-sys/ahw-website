import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { aboutData, publications, ScrollReveal, StructuredData, Breadcrumbs, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';
import styles from './page.module.css';

const trackRecordIds = ['years-exp', 'integrated-aec', 'turnkey', 'project-management', 'quality-standards'];
const sectorIds = ['commercial', 'residential', 'hospitality', 'office-fitout'];

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Why AHW' },
];

export const metadata: Metadata = {
  title: 'Why AHW',
  description: 'As a fully integrated Architecture, Interior Design, Engineering, and Construction management firm, AHW Architects provides turnkey delivery for commercial, residential, and hospitality projects.',
  alternates: {
    canonical: '/about/why-ahw',
  },
  openGraph: {
    title: 'Why AHW',
    description: 'As a fully integrated Architecture, Interior Design, Engineering, and Construction management firm, AHW Architects provides turnkey delivery for commercial, residential, and hospitality projects.',
    url: '/about/why-ahw',
    images: [{ url: '/images/about/ahw_why_ahw.jpg', width: 1200, height: 630, alt: 'AHW Architects — Why AHW' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Why AHW',
    description: 'As a fully integrated Architecture, Interior Design, Engineering, and Construction management firm, AHW Architects provides turnkey delivery for commercial, residential, and hospitality projects.',
    images: ['/images/about/ahw_why_ahw.jpg'],
  },
};

export default async function WhyAhwPage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/about/why-ahw`
    },
    "name": "Why AHW | AHW Architects",
    "description": "As a fully integrated Architecture, Interior Design, Engineering, and Construction management firm, AHW Architects provides turnkey delivery."
  };

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs)} />

      {/* SECTION 1: Large Hero Statement */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <Breadcrumbs items={breadcrumbs} />
          <ScrollReveal direction="up" delay={0.1}>
            <h1 className={styles.heroTitle}>{aboutData.textContent.whyAhwHeroTitle}</h1>
            <h2 className={styles.heroSubtitle}>{aboutData.textContent.whyAhwHeroSubtitle}</h2>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 2: Supporting Introduction */}
      <section className={styles.introSection}>
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <ScrollReveal direction="left" delay={0.2} className={styles.introTextWrapper}>
              <p className={styles.introParagraph}>{aboutData.textContent.whyAhwIntroParagraph}</p>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.4} className={styles.introImageWrapper}>
              <div className={styles.imageContainer}>
                <Image src="/images/about/ahw_why_ahw.jpg" alt="Why AHW" fill priority fetchPriority="high" sizes="(max-width: 1024px) 100vw, 50vw" className={styles.introImage} />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 2.5: Process / Methodology */}
      <section className={styles.processSection}>
        <div className={styles.container}>
          <ScrollReveal>
            <h2 className={styles.sectionHeading}>{aboutData.textContent.processSectionTitle}</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className={styles.processIntro}>{aboutData.textContent.processSectionIntro}</p>
          </ScrollReveal>
          <div className={styles.processList}>
            {aboutData.process.map((step, index) => (
              <ScrollReveal key={step.id} delay={index * 0.06} direction="up" className={styles.revealWrapper}>
                <div className={styles.processStep}>
                  <span className={styles.processNumeral}>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className={styles.processTitle}>{step.title}</h3>
                    <p className={styles.processDescription}>{step.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Premium Pillars */}
      <section className={styles.pillarsSection}>
        <div className={styles.container}>
          <ScrollReveal>
            <h2 className={styles.sectionHeading}>{aboutData.textContent.whyAhwPillarsTitle}</h2>
          </ScrollReveal>
          <div className={styles.pillarsGrid}>
            {aboutData.whyAhwPillars.map((pillar, index) => (
              <ScrollReveal key={pillar.id} delay={index * 0.1} className={styles.revealWrapper}>
                <div className={styles.pillarCard}>
                  <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                  <p className={styles.pillarDescription}>{pillar.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Why Clients Choose AHW */}
      <section className={styles.strengthsSection}>
        <div className={styles.container}>
          <ScrollReveal>
            <h2 className={styles.sectionHeading}>{aboutData.textContent.whyAhwStrengthsTitle}</h2>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <span className={styles.strengthsGroupLabel}>Track Record</span>
          </ScrollReveal>
          <div className={styles.strengthsGrid}>
            {aboutData.whyAhwStrengths.filter((s) => trackRecordIds.includes(s.id)).map((strength, index) => (
              <ScrollReveal key={strength.id} delay={index * 0.05} direction="up" className={styles.revealWrapper}>
                <div className={styles.strengthCard}>
                  <div className={styles.strengthIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <h3 className={styles.strengthTitle}>{strength.title}</h3>
                  <p className={styles.strengthDescription}>{strength.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.05}>
            <span className={`${styles.strengthsGroupLabel} ${styles.strengthsGroupLabelSecond}`}>Sectors We Design For</span>
          </ScrollReveal>
          <div className={styles.strengthsGrid}>
            {aboutData.whyAhwStrengths.filter((s) => sectorIds.includes(s.id)).map((strength, index) => (
              <ScrollReveal key={strength.id} delay={index * 0.05} direction="up" className={styles.revealWrapper}>
                <div className={styles.strengthCard}>
                  <div className={styles.strengthIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <h3 className={styles.strengthTitle}>{strength.title}</h3>
                  <p className={styles.strengthDescription}>{strength.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4.5: Press & Recognition */}
      <section className={styles.pressSection}>
        <div className={styles.container}>
          <ScrollReveal>
            <span className={styles.pressLabel}>As Seen In</span>
          </ScrollReveal>
          <div className={styles.pressGrid}>
            {publications.map((pub, index) => (
              <ScrollReveal key={pub.id} delay={index * 0.08} direction="up">
                <Link href={`/insights/publications/${pub.slug}`} className={styles.pressCard}>
                  <span className={styles.pressOutlet}>{pub.outlet}</span>
                  <p className={styles.pressTitle}>{pub.title}</p>
                  {pub.tags && pub.tags.includes('Awards') && (
                    <span className={styles.pressBadge}>Award Feature</span>
                  )}
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: Client Confidence Section */}
      <section className={styles.confidenceSection}>
        <div className={styles.container}>
          <div className={styles.confidenceContent}>
            <ScrollReveal direction="left">
              <h2 className={styles.confidenceTitle}>{aboutData.textContent.whyAhwConfidenceTitle}</h2>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.2}>
              <p className={styles.confidenceText}>{aboutData.textContent.whyAhwConfidenceText}</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 6: Call To Action */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <ScrollReveal direction="up">
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>{aboutData.textContent.whyAhwCtaTitle}</h2>
              <p className={styles.ctaText}>{aboutData.textContent.whyAhwCtaText}</p>
              <div className={styles.ctaButtons}>
                <Link href="/contact" className={styles.primaryButton}>
                  Start Your Project
                </Link>
                <Link href="/contact" className={styles.secondaryButton}>
                  Schedule a Consultation
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
