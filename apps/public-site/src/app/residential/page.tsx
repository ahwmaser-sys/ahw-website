import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  projects,
  sortByDisplayOrder,
  faqItems,
  StructuredData,
  Breadcrumbs,
  buildBreadcrumbJsonLd,
} from '@agp/ui-components';
import { getSiteUrl } from '../../lib/site-config';
import { getPublicResidentialExperience, type PublicResidentialExperienceEntry } from '../../lib/portal/residential-experience';
import styles from './page.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Residential' },
];

const TITLE = 'Residential Architecture & Interior Design in Egypt & Kuwait | AHW Architects';
const DESCRIPTION = 'AHW Architects designs and builds private residences, villas, and apartments across Egypt and Kuwait — architecture, interior design, engineering, and construction under one accountable team.';

export const metadata: Metadata = {
  title: 'Residential Architecture & Interior Design',
  description: DESCRIPTION,
  alternates: {
    canonical: '/residential',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/residential',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Same three FAQ items regardless of visit — this page's FAQ isn't
// filtered/personalized, so a plain constant lookup by id is simpler and
// more robust to reordering in faq.ts than an index-based slice.
const RESIDENTIAL_FAQ_IDS = ['villa-private-residence', 'services-offered', 'design-and-construction-together'];

// Groups preserve each entry's Admin-set displayOrder — the region a
// group appears under is decided entirely by the data (first entry with
// that region, in order), never a hardcoded region list here. Adding a
// new region in Admin needs no frontend change.
function groupByRegion(entries: PublicResidentialExperienceEntry[]): [string, PublicResidentialExperienceEntry[]][] {
  const order: string[] = [];
  const byRegion = new Map<string, PublicResidentialExperienceEntry[]>();
  for (const entry of entries) {
    if (!byRegion.has(entry.region)) {
      order.push(entry.region);
      byRegion.set(entry.region, []);
    }
    byRegion.get(entry.region)!.push(entry);
  }
  return order.map((region) => [region, byRegion.get(region)!]);
}

export default async function ResidentialPage() {
  const siteUrl = await getSiteUrl();
  const pageUrl = `${siteUrl}/residential`;

  const residentialProjects = sortByDisplayOrder(projects.filter((p) => p.sector === 'Residential')).slice(0, 6);
  const residentialExperience = await getPublicResidentialExperience();
  const experienceGroups = groupByRegion(residentialExperience);
  const residentialFaq = RESIDENTIAL_FAQ_IDS.map((id) => faqItems.find((f) => f.id === id)).filter((f): f is NonNullable<typeof f> => Boolean(f));
  const projectBySlug = new Map(projects.map((p) => [p.slug, p]));

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: TITLE,
    description: DESCRIPTION,
    isPartOf: { '@id': `${siteUrl}/#website` },
    about: { '@id': `${siteUrl}/#organization` },
  };

  // Only the real, delivered case-study projects shown below — never the
  // "Selected Residential Experience" entries above, which are
  // professional-experience text references, not itemizable creative
  // works (see residentialExperience.ts's file-level comment).
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: residentialProjects.length,
      itemListElement: residentialProjects.map((p, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}/projects/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <main className={styles.main}>
      <StructuredData data={webPageJsonLd} />
      <StructuredData data={collectionJsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />

      {/* 1. Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <Breadcrumbs items={breadcrumbs} />
          <span className={styles.eyebrow}>Residential</span>
          <h1 className={styles.title}>Homes, Designed and Built by One Accountable Team.</h1>
          <p className={styles.subtitle}>
            Private villas, chalets, and apartments across Egypt and Kuwait — architecture and interior design carried
            through engineering, construction, and fit-out by the same team, from first concept to final handover.
          </p>
        </div>
      </section>

      {/* 2. Capability — links to the real discipline pages, in context */}
      <section className={styles.capability}>
        <div className={styles.container}>
          <p className={styles.capabilityText}>
            A residential project draws on the same integrated model as any other AHW project: <Link href="/expertise/interior-design">Interior Design</Link> and{' '}
            <Link href="/expertise/architecture">Architecture</Link> for the space itself, engineering for the structural and MEP work behind it, and{' '}
            <Link href="/expertise/design-build">Design &amp; Build</Link> or <Link href="/expertise/fit-out">Fit-Out</Link> to carry it through construction and handover —
            all under the one team responsible for the design.
          </p>
        </div>
      </section>

      {/* 3. Selected Residential Projects */}
      {residentialProjects.length > 0 && (
        <section className={styles.projectsSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Selected Residential Projects</h2>
              <Link href="/projects?sector=residential" className={styles.viewAll}>View All Residential Projects →</Link>
            </div>
            <div className={styles.projectsGrid}>
              {residentialProjects.map((project) => (
                <Link key={project.slug} href={`/projects/${project.slug}`} className={styles.projectCard}>
                  <div className={styles.projectImageWrapper}>
                    {(project.hubFlagshipImage || project.heroImage) && (
                      <Image
                        src={project.hubFlagshipImage || project.heroImage!}
                        alt={`${project.title} — Residential project in ${project.city}, ${project.market}`}
                        fill
                        sizes="(max-width: 1023px) 100vw, 33vw"
                        className={styles.projectImage}
                      />
                    )}
                  </div>
                  <div className={styles.projectMeta}>
                    <h3 className={styles.projectTitle}>{project.title}</h3>
                    <span className={styles.projectLocation}>{project.city}, {project.market}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Selected Residential Experience — professional experience, not
          case studies; kept visually and structurally distinct from the
          project cards above so the difference is never ambiguous. */}
      {residentialExperience.length > 0 && (
        <section className={styles.experienceSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Selected Residential Experience</h2>
            <p className={styles.experienceIntro}>
              Beyond the delivered projects above, AHW&rsquo;s principals and team carry professional experience across a
              number of established residential communities in Egypt.
            </p>
            <div className={styles.experienceGroups}>
              {experienceGroups.map(([region, entries]) => (
                <div key={region} className={styles.experienceGroup}>
                  <span className={styles.experienceRegion}>{region}</span>
                  <ul className={styles.experienceList}>
                    {entries.map((entry) => {
                      const linkedProject = entry.linkedProjectSlug ? projectBySlug.get(entry.linkedProjectSlug) : undefined;
                      return (
                        <li key={entry.id} className={styles.experienceItem}>
                          <span className={styles.experienceName}>
                            {linkedProject ? <Link href={`/projects/${linkedProject.slug}`}>{entry.name}</Link> : entry.name}
                            {entry.developer && <span className={styles.experienceDeveloper}>Developer: {entry.developer}</span>}
                          </span>
                          <span className={styles.experienceWording}>{entry.publicWording}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. FAQ excerpt */}
      {residentialFaq.length > 0 && (
        <section className={styles.faqSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Residential Questions</h2>
              <Link href="/faq" className={styles.viewAll}>See All FAQs →</Link>
            </div>
            <div className={styles.faqList}>
              {residentialFaq.map((item) => (
                <div key={item.id} className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>{item.question}</h3>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Closing CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Design Your Home.</h2>
          <p className={styles.ctaText}>Tell us about your project — location, scope, and rough timeline — and the relevant office will follow up to schedule a consultation.</p>
          <div className={styles.ctaButtons}>
            <Link href="/contact" className={styles.primaryButton}>Start a Conversation</Link>
            <Link href="/projects?sector=residential" className={styles.secondaryButton}>Explore Residential Projects</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
