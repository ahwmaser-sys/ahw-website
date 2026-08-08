import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { aboutData, getDocumentById, DownloadCard, ScrollReveal, StructuredData, Breadcrumbs, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { CareersForm } from '../../../features/about/components/CareersForm';
import { getSiteUrl } from '../../../lib/site-config';
import styles from './page.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Careers' },
];

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join AHW Architects. Build your career with a world-class architectural and engineering firm in Kuwait, Egypt, and the UAE.',
  alternates: {
    canonical: '/about/careers',
  },
  openGraph: {
    title: 'Careers',
    description: 'Join AHW Architects. Build your career with a world-class architectural and engineering firm in Kuwait, Egypt, and the UAE.',
    url: '/about/careers',
    images: [{ url: '/images/about/ahw_careers.jpg', width: 1200, height: 630, alt: 'AHW Architects — Careers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers',
    description: 'Join AHW Architects. Build your career with a world-class architectural and engineering firm in Kuwait, Egypt, and the UAE.',
    images: ['/images/about/ahw_careers.jpg'],
  },
};

export default async function CareersPage() {
  const hrApplication = getDocumentById('hrApplication');
  const siteUrl = await getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/about/careers`
    },
    "name": "Careers at AHW | Join Our Team",
    "description": "Explore career opportunities at AHW Architects."
  };

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <Breadcrumbs items={breadcrumbs} />
          <ScrollReveal direction="up">
            <h1 className={styles.title}>{aboutData.textContent.careersHeroTitle}</h1>
            <p className={styles.subtitle}>{aboutData.textContent.careersHeroSubtitle}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.introSection}>
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <ScrollReveal direction="left" className={styles.introContent}>
               <h2>{aboutData.textContent.careersIntroTitle}</h2>
               <p>{aboutData.textContent.careersIntroText}</p>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.2} className={styles.introImageWrapper}>
              <div className={styles.imageContainer}>
                <Image src="/images/about/ahw_careers.jpg" alt="Careers at AHW" fill priority fetchPriority="high" sizes="(max-width: 1024px) 100vw, 50vw" className={styles.introImage} />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className={styles.downloadSection}>
        <div className={styles.container}>
          <ScrollReveal direction="up" className={styles.downloadWrapper}>
             <div className={styles.downloadText}>
               <h3>{aboutData.textContent.careersDownloadTitle}</h3>
               <p>{aboutData.textContent.careersDownloadText}</p>
             </div>
             {hrApplication && (
               <DownloadCard document={hrApplication} layout="horizontal" className={styles.hrCard} />
             )}
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.container}>
           <ScrollReveal direction="up" className={styles.formHeader}>
             <h2>{aboutData.textContent.careersFormTitle}</h2>
             <p>{aboutData.textContent.careersFormText}</p>
           </ScrollReveal>
           
           <ScrollReveal delay={0.2} className={styles.formContainer}>
             <CareersForm />
           </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
