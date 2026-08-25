import { Hero, ImageRotator, aboutData, StructuredData, publications, type Office } from '@agp/ui-components';
import Link from 'next/link';
import Image from 'next/image';
import type { Review } from '@prisma/client';
import styles from './home.module.css';
import type { SelectedWorkItem } from '../lib/homepageAssets';
import { ClientReviewsSection } from './ClientReviewsSection';
import { CapabilitiesSection } from './CapabilitiesSection';

export interface HomeContentProps {
  /** Curated hero background rotation, loaded from
   *  public/homepage-assets/hero/ — see that folder's README to change it. */
  heroImages: string[];
  /** Curated "Precision in Every Dimension" rotation, loaded from
   *  public/homepage-assets/precision/. */
  precisionImages: string[];
  /** Curated Selected Work grid, loaded from
   *  public/homepage-assets/selected-work/<project-slug>/. */
  selectedWork: SelectedWorkItem[];
  /** Real offices, fetched from the database by app/page.tsx — used
   *  here only for the address in the ProfessionalService structured
   *  data below. */
  offices: readonly Office[];
  siteUrl: string;
  /** Egypt-office featured+published reviews, already filtered/ordered by
   *  app/page.tsx — this component never queries the database or Google
   *  itself. */
  reviews: Review[];
  reviewsAggregate: { averageRating: number; totalCount: number } | null;
  reviewsGoogleUrl: string | null;
}

export function HomeContent({ heroImages, precisionImages, selectedWork, offices, siteUrl, reviews, reviewsAggregate, reviewsGoogleUrl }: HomeContentProps) {
  // This node shares its @id with the root Organization in layout.tsx, so
  // its single `address` field is what external tools reading "the"
  // business address for that merged entity pick up — deliberately the
  // Egypt office, not whichever office is flagged isHeadquarters (Kuwait).
  // Kuwait's HQ status/ordering everywhere a visitor actually sees the
  // site (footer, contact tabs, the "HQ" tag) is untouched by this.
  const primaryContactOffice = offices.find((office) => office.id === 'egypt') || offices[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    // Same @id as the Organization node in layout.tsx's root JSON-LD (on
    // every page) — tells Google/AI crawlers this is the SAME real-world
    // entity, not a second, disconnected company. Without this, the site
    // described four unlinked Organization-shaped nodes (this one, the
    // root layout's, the /contact page's, and one duplicated inline on
    // every project/expertise page) that a knowledge-graph reader has no
    // way to know are the same business.
    "@id": `${siteUrl}/#organization`,
    "name": "AHW Architects",
    "description": "AHW Architects is a multidisciplinary Architecture, Interior Design & Design-Build practice serving Egypt, Kuwait, and the wider GCC.",
    "url": siteUrl,
    // Same reasoning as layout.tsx's Organization schema: Google's Rich
    // Results Test flags a missing `image` as a non-critical issue.
    "image": `${siteUrl}/og-image.jpg`,
    // Corrected from the literal string "Global" — the practice delivers in
    // Egypt, Kuwait, and the UAE (per projects.ts), not literally worldwide.
    // Matches the areaServed used in layout.tsx's Organization schema and
    // the per-project CreativeWork schema in projects/[slug]/page.tsx.
    "areaServed": [
      { "@type": "Country", "name": "Egypt" },
      { "@type": "Country", "name": "Kuwait" },
      { "@type": "Country", "name": "United Arab Emirates" },
      { "@type": "AdministrativeArea", "name": "GCC" },
    ],
    "foundingDate": "2012",
    ...(primaryContactOffice && {
      address: {
        "@type": "PostalAddress",
        streetAddress: primaryContactOffice.address.street,
        addressLocality: primaryContactOffice.address.city,
        addressCountry: primaryContactOffice.country,
      },
    }),
    // "Commercial Interiors" removed — no delivered project carries a
    // Commercial sector (see AUDIT.md D3); "Workplace Design" is the real,
    // supported equivalent (2 delivered office projects).
    "knowsAbout": [
      "Architecture", "Interior Design", "Master Planning", "Landscape Architecture",
      "Retail Fit-Out", "Workplace Design", "Residential", "Hospitality",
      "Project Management", "Construction Supervision", "Design & Build"
    ]
  };

  return (
    <>
      <StructuredData data={jsonLd} />
      <main className={styles.main}>
        <Hero
          title={
            <>
              Design.<br />
              Build.<br />
              Deliver.
            </>
          }
          supportingHeading="Architecture Without Compromise."
          subtitle="AHW Architects is a multidisciplinary architecture, interior design, engineering, and construction company delivering integrated design-build solutions from concept to completion. We create timeless, high-performance residential, commercial, hospitality, workplace, and mixed-use environments through innovation, technical excellence, and uncompromising quality."
          primaryAction={{ label: 'Explore Projects', href: '/projects' }}
          secondaryAction={{ label: 'Our Expertise', href: '/expertise' }}
          posterSrc="/images/placeholders/ahw_hero_background.jpg"
          {...(heroImages.length > 1 && { posterSrcs: heroImages })}
          posterAlt="AHW Architects — flagship design-build projects across Kuwait and Egypt"
        />

        {/* 1. INTRO & TRUST - Premium Architectural Composition */}
        <section className={styles.introSection}>
          <div className={styles.container}>
            <div className={styles.introGrid}>

              <h2 className={styles.introTitle}>Precision in Every Dimension.</h2>

              <div className={styles.introVisual}>
                {precisionImages.length > 1 ? (
                  <ImageRotator
                    images={precisionImages}
                    alt="AHW Architects — design and construction precision"
                    sizes="(max-width: 1023px) 100vw, 50vw"
                    priority={false}
                  />
                ) : (
                  <Image
                    src={precisionImages[0] || '/ahw-projects-assets/19-beit-al-watan-building/design/beit-al-watan-design-02.png'}
                    alt="AHW Architects — design and construction precision"
                    fill
                    sizes="(max-width: 1023px) 100vw, 50vw"
                    className={styles.introVisualImage}
                  />
                )}
              </div>

              <div className={styles.introContent}>
                <p className={styles.introText}>
                  We believe that true architectural excellence is born at the intersection of visionary creativity and flawless execution. Our company operates globally, delivering end-to-end solutions from master planning and conceptual design through to complete construction and bespoke interior fit-outs. We do not just design spaces; we curate environments that inspire human connection, operational efficiency, and lasting legacy.
                </p>

                <div className={styles.trustGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>{aboutData.yearsOfExperience}</span>
                    <span className={styles.statLabel}>Years of Excellence</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>{aboutData.totalProjects}</span>
                    <span className={styles.statLabel}>Projects Delivered</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>{aboutData.offices.length}</span>
                    <span className={styles.statLabel}>Global Offices</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 2. SELECTED WORK - Curated, balanced across disciplines */}
        {selectedWork.length > 0 && (
          <section className={styles.featuredSection}>
            <div className={styles.container}>
              <div className={styles.featuredHeader}>
                <h2 className={styles.featuredMainTitle}>Selected Work</h2>
                <Link href="/projects" className={styles.featuredViewAll}>View All Projects →</Link>
              </div>

              <div className={styles.featuredGrid}>
                {selectedWork.map((project) => (
                  <Link key={project.slug} href={`/projects/${project.slug}`} className={styles.featuredCard}>
                    <div className={styles.featuredImageWrapper}>
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        sizes="(max-width: 1023px) 100vw, 50vw"
                        className={styles.featuredImage}
                      />
                      {project.status !== 'Completed' && (
                        <span className={styles.featuredStatusBadge}>{project.status}</span>
                      )}
                    </div>
                    <div className={styles.featuredCardMeta}>
                      <h3 className={styles.featuredCardTitle}>{project.title}</h3>
                      <span className={styles.featuredCardLocation}>{project.sector} · {project.city}, {project.market}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3. PRESS - As Featured In */}
        {publications.length > 0 && (
          <section className={styles.pressSection}>
            <div className={styles.container}>
              <div className={styles.pressBar}>
                <span className={styles.pressLabel}>As Featured In</span>
                <div className={styles.pressList}>
                  {publications.map((publication) => (
                    <Link
                      key={publication.id}
                      href={`/insights/publications/${publication.slug}`}
                      className={styles.pressItem}
                    >
                      {publication.outlet}
                    </Link>
                  ))}
                </div>
                <Link href="/insights/publications" className={styles.pressViewAll}>
                  View Press →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 4. CAPABILITIES - Award Winning Interactive List */}
        <CapabilitiesSection />

        {/* 5. CLIENT REVIEWS — server-rendered from our own database only
            (see app/page.tsx), never a live Google API call. Renders
            nothing if there's no featured+published review yet. */}
        <ClientReviewsSection reviews={reviews} aggregate={reviewsAggregate} googleUrl={reviewsGoogleUrl} />

        {/* 6. CLOSING CTA */}
        <section className={styles.homeCtaSection}>
          <div className={styles.container}>
            <h2 className={styles.homeCtaTitle}>Your Project Belongs Here Next.</h2>
            <p className={styles.homeCtaText}>
              Whether you&rsquo;re evaluating land before you buy it or ready to break ground, AHW brings architecture, engineering, and construction under one team.
            </p>
            <div className={styles.homeCtaButtons}>
              <Link href="/contact" className={styles.homeCtaPrimary}>Start a Conversation</Link>
              <Link href="/projects" className={styles.homeCtaSecondary}>See Our Work</Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
