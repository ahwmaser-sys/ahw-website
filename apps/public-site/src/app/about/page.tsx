import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Hero } from '@agp/ui-components';
import { aboutData, getDocumentById } from '@agp/ui-components';
import { DownloadCard } from '@agp/ui-components';
import { StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../lib/site-config';
import styles from './page.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'About' },
];

export const metadata: Metadata = {
  title: 'About Us | Design & Build',
  description: aboutData.visionStatement,
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Us | Design & Build',
    description: aboutData.visionStatement,
    url: '/about',
    images: [{ url: '/images/placeholders/ahw_hero_background.jpg', width: 1200, height: 630, alt: 'AHW Architects — About Us' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | Design & Build',
    description: aboutData.visionStatement,
    images: ['/images/placeholders/ahw_hero_background.jpg'],
  },
};

export default async function AboutPage() {
  const companyProfile = getDocumentById('companyProfile');
  const siteUrl = await getSiteUrl();

  return (
    <main className={styles.main}>
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <Hero
        title="We build legacies."
        subtitle={aboutData.visionStatement}
        posterSrc="/images/placeholders/ahw_hero_background.jpg"
        breadcrumbs={breadcrumbs}
      />

      <section className={styles.introSection}>
        <div className={styles.container}>
          <div className={styles.textContent}>
            <h2 className={styles.heading}>{aboutData.textContent.aboutIntroTitle}</h2>
            <p className={styles.paragraph}>{aboutData.textContent.aboutIntroParagraph1}</p>
            <p className={styles.paragraph}>{aboutData.textContent.aboutIntroParagraph2}</p>
            <div className={styles.trustStrip}>
              <div className={styles.trustStat}>
                <span className={styles.trustNumber}>{aboutData.totalProjects}</span>
                <span className={styles.trustLabel}>Projects Delivered</span>
              </div>
              <div className={styles.trustStat}>
                <span className={styles.trustNumber}>{aboutData.yearsOfExperience}</span>
                <span className={styles.trustLabel}>Founders&rsquo; Experience</span>
              </div>
              <div className={styles.trustStat}>
                <span className={styles.trustNumber}>{aboutData.offices.length}</span>
                <span className={styles.trustLabel}>Offices</span>
              </div>
              <div className={styles.trustStat}>
                <span className={styles.trustNumber}>{new Date().getFullYear() - parseInt(aboutData.founded, 10)}+</span>
                <span className={styles.trustLabel}>Years as AHW Architects</span>
              </div>
            </div>
          </div>

          <div className={styles.navigationCards}>
            <Link href="/about/about-us" className={styles.navCard}>
              <div className={styles.navCardImage}>
                <Image src="/images/placeholders/ahw_residential.jpg" alt="Our Story" fill sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className={styles.navCardOverlay} />
              <div className={styles.navCardContent}>
                <h3>{aboutData.textContent.storyHeroTitle}</h3>
                <p>{aboutData.textContent.storyHeroSubtitle}</p>
                <span className={styles.arrow}>→</span>
              </div>
            </Link>

            <Link href="/about/why-ahw" className={styles.navCard}>
              <div className={styles.navCardImage}>
                <Image src="/images/about/about-vision.jpg" alt="Why AHW" fill sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className={styles.navCardOverlay} />
              <div className={styles.navCardContent}>
                <h3>{aboutData.textContent.whyAhwHeroTitle}</h3>
                <p>{aboutData.textContent.whyAhwHeroSubtitle}</p>
                <span className={styles.arrow}>→</span>
              </div>
            </Link>

            <Link href="/about/careers" className={styles.navCard}>
              <div className={styles.navCardImage}>
                <Image src="/images/about/about-careers.jpg" alt="Careers at AHW" fill sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className={styles.navCardOverlay} />
              <div className={styles.navCardContent}>
                <h3>{aboutData.textContent.careersHeroTitle}</h3>
                <p>{aboutData.textContent.careersHeroSubtitle}</p>
                <span className={styles.arrow}>→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.downloadSection}>
        <div className={styles.container}>
          <h2 className={styles.downloadHeading}>Company Profile</h2>
          {/* /capability-statement had no inbound internal links anywhere
              on the site — this is its natural home, right next to the
              PDF version of the same content. */}
          <p className={styles.downloadText}>Download our complete company profile, or <Link href="/capability-statement">view our capability statement online</Link>, to learn more about our services, expertise, and featured projects.</p>
          {companyProfile && (
            <DownloadCard document={companyProfile} layout="horizontal" className={styles.downloadCard} />
          )}
        </div>
      </section>
    </main>
  );
}
