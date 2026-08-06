import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { aboutData, Timeline, StructuredData, NativeReveal, Breadcrumbs, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { PrincipalExperience } from './PrincipalExperience';
import { getSiteUrl } from '../../../lib/site-config';
import styles from './page.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Our Story & Leadership' },
];

export const metadata: Metadata = {
  title: 'Our Story & Leadership',
  description: 'The story behind AHW Architects, our multidisciplinary Design & Build process, and the visionary leadership driving our success.',
  alternates: {
    canonical: '/about/about-us',
  },
  openGraph: {
    title: 'Our Story & Leadership',
    description: 'The story behind AHW Architects, our multidisciplinary Design & Build process, and the visionary leadership driving our success.',
    url: '/about/about-us',
    images: [{ url: '/images/about/ahw_about_hero.jpg', width: 1200, height: 630, alt: 'AHW Architects — Our Story & Leadership' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Story & Leadership',
    description: 'The story behind AHW Architects, our multidisciplinary Design & Build process, and the visionary leadership driving our success.',
    images: ['/images/about/ahw_about_hero.jpg'],
  },
};

export default async function AboutUsPage() {
  const siteUrl = await getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/about/about-us`
    },
    "name": "Our Story & Leadership | AHW Architects",
    "description": "The story behind AHW Architects, our multidisciplinary Design & Build process, and the visionary leadership driving our success."
  };

  const leadershipJsonLd = aboutData.leadership.map((leader) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": leader.name,
    "jobTitle": leader.role,
    "description": leader.description,
    "worksFor": {
      "@type": "Organization",
      "name": "AHW Architects",
      "url": siteUrl
    },
    "url": `${siteUrl}/about/about-us`
  }));

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs)} />
      {leadershipJsonLd.map((person) => (
        <StructuredData key={person.name} data={person} />
      ))}

      {/* 1. Hero / Editorial Opening */}
      <section className={styles.heroSection}>
        <NativeReveal behavior="drift" className={styles.heroImageWrapper}>
            <Image
              src="/images/about/ahw_about_hero.jpg"
              alt="AHW Architects"
              fill
              sizes="100vw"
              priority
              fetchPriority="high"
              className={styles.heroImage}
            />
        </NativeReveal>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <Breadcrumbs items={breadcrumbs} />
            <NativeReveal behavior="wipe" as="h1" className={styles.title}>
              <span>{aboutData.textContent.storyHeroTitle}</span>
            </NativeReveal>
            <NativeReveal behavior="wipe" as="p" delay={0.2} className={styles.subtitle}>
              <span>{aboutData.textContent.storyHeroSubtitle}</span>
            </NativeReveal>
          </div>
        </div>
      </section>

      {/* 2. Story / Narrative */}
      <section className={styles.storySection}>
        <div className={`${styles.container} ${styles.splitLayout}`}>
          <div className={styles.textContent}>
            <NativeReveal behavior="wipe" as="h2" className={styles.sectionHeading}>
              <span>{aboutData.textContent.storySectionTitle}</span>
            </NativeReveal>
            <NativeReveal behavior="draw" className={styles.hairlineRule} />
            <p className={styles.paragraph}>{aboutData.textContent.storyParagraph1}</p>
            <p className={styles.paragraph}>{aboutData.textContent.storyParagraph2}</p>

            <div className={styles.statsRow}>
              <div className={styles.statBlock}>
                <span className={styles.statNumber}>{aboutData.totalProjects}</span>
                <span className={styles.statLabel}>Projects Delivered</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statNumber}>{aboutData.yearsOfExperience}</span>
                <span className={styles.statLabel}>Founders&rsquo; Combined Experience</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statNumber}>{aboutData.offices.length}</span>
                <span className={styles.statLabel}>Offices</span>
              </div>
            </div>
          </div>
          <div className={styles.imageContent}>
            <NativeReveal behavior="aperture" className={styles.apertureImageWrapper}>
              <Image
                src="/images/about/ahw_project_1.jpg"
                alt="AHW Architects project detail"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={styles.storyImage}
              />
            </NativeReveal>
          </div>
        </div>
      </section>

      {/* 3. Mission / Vision / Values */}
      <section className={styles.mvvSection}>
        <div className={styles.container}>
          <div className={styles.mvvGrid}>
            <div className={styles.mvvBlock}>
              <span className={styles.mvvLabel}>Mission</span>
              <p className={styles.mvvText}>{aboutData.missionStatement}</p>
            </div>
            <div className={styles.mvvBlock}>
              <span className={styles.mvvLabel}>Vision</span>
              <p className={styles.mvvText}>{aboutData.visionStatement}</p>
            </div>
          </div>
          <div className={styles.valuesRow}>
            <span className={styles.mvvLabel}>Values</span>
            <div className={styles.valuesTags}>
              {aboutData.whyAhwPillars.map((pillar) => (
                <span key={pillar.id} className={styles.valueTag}>{pillar.title}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Timeline */}
      <section className={styles.timelineSection}>
        <div className={styles.container}>
          <NativeReveal behavior="wipe" as="h2" className={styles.sectionHeading}>
            <span>Company Timeline</span>
          </NativeReveal>
          <NativeReveal behavior="draw" className={styles.hairlineRule} />
          <Timeline events={aboutData.timeline} />
        </div>
      </section>

      {/* 5. Leadership */}
      <section className={styles.leadershipSection}>
        <div className={styles.container}>
          <NativeReveal behavior="wipe" as="h2" className={styles.sectionHeading}>
            <span>{aboutData.textContent.leadershipSectionTitle}</span>
          </NativeReveal>
          <NativeReveal behavior="draw" className={styles.hairlineRule} />
          <p className={styles.sectionIntro}>{aboutData.textContent.leadershipSectionIntro}</p>

          <div className={styles.splitLayout}>
            <NativeReveal behavior="aperture" className={styles.apertureImageWrapper}>
              <Image
                src="/images/about/ahw-leadership-portrait.jpg"
                alt="Ahmed Al Wardany, Founder and Principal, and Mahmoud Al Wardany, Managing Partner and Egypt CEO, of AHW Architects"
                fill
                className={styles.leadershipImage}
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
               />
            </NativeReveal>
            <div className={styles.profiles}>
              {aboutData.leadership.map((leader) => (
                <div key={leader.id} className={styles.profileBlock}>
                  <h3 className={styles.leaderName}>{leader.name}</h3>
                  <span className={styles.leaderRole}>{leader.role}</span>
                  <p className={styles.leaderDescription}>{leader.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Principal Experience (Embedded Native Section) */}
      <PrincipalExperience />

      {/* 7. Closing CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <NativeReveal behavior="wipe" as="h2" className={styles.ctaTitle}>
            <span>{aboutData.textContent.aboutUsNextStepTitle}</span>
          </NativeReveal>
          <p className={styles.ctaText}>{aboutData.textContent.aboutUsNextStepText}</p>
          <div className={styles.ctaButtons}>
            <Link href="/contact" className={styles.primaryButton}>Start a Conversation</Link>
            <Link href="/projects" className={styles.secondaryButton}>See Our Work</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
