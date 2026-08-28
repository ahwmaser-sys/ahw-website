'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal } from '../animations/ScrollReveal';
import { Button } from '../atoms/Button';
import { Breadcrumbs, type BreadcrumbItem } from '../navigation/Breadcrumbs';
import styles from './DisciplinePage.module.css';

export interface DisciplineService {
  number: string;
  name: string;
  proposition: string;
}

export interface DisciplineFeature {
  title: string;
  description: string;
  image: string;
  imagePosition?: 'left' | 'right';
}

export interface DisciplineFeaturedProject {
  title: string;
  href: string;
  sector: string;
  city: string;
  image: string;
}

export interface DisciplinePageProps {
  numeral: string;
  eyebrow: string;
  title: string;
  heroImage: string;
  heroStatement: string;
  intro: string;
  services: DisciplineService[];
  feature?: DisciplineFeature;
  quote?: { line1: string; line2: string };
  projectsHref: string;
  // A single real, delivered project whose own services genuinely include
  // this discipline — concrete evidence linked from the discipline page
  // itself, not just the generic "View Projects" hub. Optional so a
  // discipline with no clean match isn't forced into one.
  featuredProject?: DisciplineFeaturedProject;
  // Further real, delivered projects whose services[] also genuinely
  // include this discipline — rendered alongside featuredProject rather
  // than replacing it. Optional and additive: omitting it leaves this
  // section identical to before for every page that doesn't pass it.
  additionalProjects?: DisciplineFeaturedProject[];
  otherDisciplines: { name: string; href: string }[];
  breadcrumbs?: BreadcrumbItem[];
}

export const DisciplinePage: React.FC<DisciplinePageProps> = ({
  numeral,
  eyebrow,
  title,
  heroImage,
  heroStatement,
  intro,
  services,
  feature,
  quote,
  projectsHref,
  featuredProject,
  additionalProjects,
  otherDisciplines,
  breadcrumbs,
}) => {
  return (
    <main className={styles.main}>
      {/* HERO */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <Image src={heroImage} alt={`AHW Architects — ${title} discipline`} fill sizes="100vw" priority fetchPriority="high" className={styles.heroImage} />
        </div>
        <div className={styles.heroContent}>
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} variant="onDark" />}
          <span className={styles.heroNumeral}>{numeral}</span>
          <span className={styles.heroEyebrow}>{eyebrow}</span>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroStatement}>{heroStatement}</p>
        </div>
      </section>

      {/* INTRO */}
      <section className={styles.introSection}>
        <div className={styles.container}>
          <ScrollReveal>
            <p className={styles.introText}>{intro}</p>
          </ScrollReveal>
        </div>
      </section>

      {/* SERVICES */}
      <section className={styles.servicesSection}>
        <div className={styles.container}>
          <ScrollReveal>
            <h2 className={styles.sectionHeading}>What This Covers</h2>
          </ScrollReveal>
          <div className={styles.servicesList}>
            {services.map((service, index) => (
              <ScrollReveal key={service.number} delay={index * 0.08} className={styles.serviceRow}>
                <div className={styles.serviceRowInner}>
                  <span className={styles.serviceNumber}>{service.number}</span>
                  <div className={styles.serviceText}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <p className={styles.serviceProposition}>{service.proposition}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* OPTIONAL FEATURE SPLIT */}
      {feature && (
        <section className={styles.featureSection}>
          <div
            className={`${styles.featureGrid} ${feature.imagePosition === 'left' ? styles.featureImageLeft : ''}`}
          >
            <ScrollReveal direction={feature.imagePosition === 'left' ? 'right' : 'left'} className={styles.featureImageWrapper}>
              <Image src={feature.image} alt={feature.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className={styles.featureImage} />
            </ScrollReveal>
            <ScrollReveal direction={feature.imagePosition === 'left' ? 'left' : 'right'} className={styles.featureTextWrapper}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* OPTIONAL QUOTE / THRESHOLD */}
      {quote && (
        <section className={styles.quoteSection}>
          <div className={styles.quoteContent}>
            <p className={styles.quoteText}>{quote.line1}</p>
            <p className={styles.quoteTextMuted}>{quote.line2}</p>
          </div>
        </section>
      )}

      {/* EVIDENCE — a real, delivered project in this discipline */}
      {featuredProject && (
        <section className={styles.evidenceSection}>
          <div className={styles.container}>
            <span className={styles.evidenceLabel}>Delivered</span>
            <div className={styles.evidenceList}>
              <Link href={featuredProject.href} className={styles.evidenceCard}>
                <div className={styles.evidenceImageWrapper}>
                  <Image
                    src={featuredProject.image}
                    alt={featuredProject.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 240px"
                    className={styles.evidenceImage}
                  />
                </div>
                <div>
                  <h3 className={styles.evidenceTitle}>{featuredProject.title}</h3>
                  <span className={styles.evidenceMeta}>
                    {featuredProject.sector} · {featuredProject.city}
                  </span>
                  <br />
                  <span className={styles.evidenceLinkText}>View Project →</span>
                </div>
              </Link>
              {additionalProjects?.map((project) => (
                <Link key={project.href} href={project.href} className={styles.evidenceCard}>
                  <div className={styles.evidenceImageWrapper}>
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 240px"
                      className={styles.evidenceImage}
                    />
                  </div>
                  <div>
                    <h3 className={styles.evidenceTitle}>{project.title}</h3>
                    <span className={styles.evidenceMeta}>
                      {project.sector} · {project.city}
                    </span>
                    <br />
                    <span className={styles.evidenceLinkText}>View Project →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <ScrollReveal className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>See {title} In Practice</h2>
            <p className={styles.ctaText}>Explore delivered projects across Egypt and the Gulf, or start a conversation about your next one.</p>
            <div className={styles.ctaButtons}>
              <Button as="a" href={projectsHref} variant="primary">View Projects →</Button>
              <Button as="a" href="/contact" variant="secondary">Start a Conversation</Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* OTHER DISCIPLINES */}
      <section className={styles.otherSection}>
        <div className={styles.container}>
          <span className={styles.otherLabel}>Other Disciplines</span>
          <div className={styles.otherList}>
            {otherDisciplines.map((d) => (
              <Link key={d.href} href={d.href} className={styles.otherLink}>
                {d.name} →
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
