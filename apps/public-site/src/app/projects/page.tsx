import type { Metadata } from 'next';
import Link from 'next/link';
import { projects, NativeReveal, HeroSlider, Breadcrumbs, StructuredData, buildBreadcrumbJsonLd, isCommercialSector, sortByDisplayOrder } from '@agp/ui-components';
import type { Project } from '@agp/ui-components';
import ProjectFilterBar from '../../components/ProjectFilterBar';
import { getSiteUrl } from '../../lib/site-config';
import styles from './page.module.css';

const BASE_BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Projects' },
];

// Title (53 chars once the layout's "| AHW Architects" template is
// appended) and description (158 chars) are grounded in the real project
// data, not the site's stated positioning: no project carries a
// 'Commercial' sector (see AUDIT.md D3), so "commercial interior design"
// is deliberately left out here even though it's one of the brief's
// target intents — see the Phase 4 SEO Review in AUDIT.md for the gap.
// PROJECTS_TITLE is also reused verbatim for openGraph/twitter/JSON-LD
// below, so it keeps the brand suffix there — only the top-level
// `title` field must stay a bare string (the layout's title.template
// appends "| AHW Architects" automatically; adding it here too would
// render doubled).
const PROJECTS_TITLE = 'Architecture & Design-Build Projects | AHW Architects';
const PROJECTS_DESCRIPTION = '20 architecture and interior design projects across Egypt and Kuwait: residential homes, retail and office fit-out, hospitality interiors, concept to turnkey.';

export const metadata: Metadata = {
  title: 'Architecture & Design-Build Projects',
  description: PROJECTS_DESCRIPTION,
  alternates: {
    canonical: '/projects',
  },
  openGraph: {
    title: PROJECTS_TITLE,
    description: PROJECTS_DESCRIPTION,
    url: '/projects',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: PROJECTS_TITLE,
    description: PROJECTS_DESCRIPTION,
  },
};

const SECTOR_COPY: Record<string, { title: React.ReactNode, desc: string, breadcrumbLabel?: string }> = {
  all: {
    title: <>Vision.<br/>Realized.</>,
    desc: 'An uncompromising portfolio of architecture and interior design. From profound concepts to immaculate execution, delivering award-winning spaces across Egypt and the Gulf.'
  },
  residential: {
    title: <>Luxury Living.<br/>Realized.</>,
    desc: 'Crafting bespoke private residences and premium living spaces. Award-winning residential architecture that balances profound privacy with seamless natural connectivity.',
    breadcrumbLabel: 'Residential',
  },
  // Aggregate of Retail + Workplace + Hospitality (see
  // data/sectorTaxonomy.ts) — real, delivered commercial-sector work, not
  // a claim the portfolio doesn't support.
  commercial: {
    title: <>Commercial Spaces.<br/>Realized.</>,
    desc: 'Retail, workplace, and hospitality environments built for real operating businesses — flagship stores, corporate headquarters, and hospitality venues designed to perform under daily use.',
    breadcrumbLabel: 'Commercial',
  },
  hospitality: {
    title: <>Exceptional Experiences.<br/>Realized.</>,
    desc: 'Designing landmark restaurants, cafes, and hospitality destinations. Creating memorable, human-centered spaces that encourage longer customer stays.',
    breadcrumbLabel: 'Hospitality',
  },
  workplace: {
    title: <>Future Workplaces.<br/>Realized.</>,
    desc: 'Designing dynamic, productivity-focused corporate headquarters. Environments that inspire collaboration, focus, and company culture.',
    breadcrumbLabel: 'Workplace',
  },
  retail: {
    title: <>Retail Destinations.<br/>Realized.</>,
    desc: 'Creating immersive retail environments and flagship stores that capture consumer imagination and drive brand engagement.',
    breadcrumbLabel: 'Retail',
  }
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [resolvedParams, siteUrl] = await Promise.all([searchParams, getSiteUrl()]);
  const activeSector = (resolvedParams.sector as string) || 'All';
  const activeMarket = (resolvedParams.market as string) || 'All';

  const filteredProjects = projects.filter((p) => {
    const pSector = p.sector.toLowerCase();
    const sectorParam = activeSector.toLowerCase();
    // 'commercial' is an aggregate (Retail + Workplace + Hospitality), not
    // a literal project.sector value — see data/sectorTaxonomy.ts.
    const matchSector = sectorParam === 'all'
      || (sectorParam === 'commercial' ? isCommercialSector(p.sector) : pSector === sectorParam);
    const matchMarket = activeMarket.toLowerCase() === 'all' || p.market.toLowerCase() === activeMarket.toLowerCase();
    return matchSector && matchMarket;
  });

  // Explicit, curated order (Flagship first, then alphabetical within
  // tier) — never the incidental order projects.ts happens to declare
  // them in. See data/projectOrder.ts.
  const orderedProjects = sortByDisplayOrder(filteredProjects);

  // Calculate metrics
  const totalProjects = projects.length;
  // Approximated from available area data
  const totalArea = projects.reduce((acc, p) => acc + (parseInt(p.area.replace(/,/g, '')) || 0), 0);
  const totalMarkets = new Set(projects.map(p => p.market)).size;

  const currentCopy = SECTOR_COPY[activeSector.toLowerCase()] || SECTOR_COPY.all!;
  // Make the hero images dynamic to the active filtered projects, fallback to all if filtered list is too small
  const heroSourceProjects = orderedProjects.length > 0 ? orderedProjects : projects;

  // Reflects the active sector filter (e.g. Home > Projects > Commercial)
  // rather than always showing the static Home > Projects trail.
  const breadcrumbs = currentCopy.breadcrumbLabel
    ? [...BASE_BREADCRUMBS.slice(0, 1), { label: 'Projects', href: '/projects' }, { label: currentCopy.breadcrumbLabel }]
    : BASE_BREADCRUMBS;

  // Describes what's actually rendered on this URL (post-filter), not
  // always the full 20 — accurate for both /projects and filtered views
  // like /projects?sector=retail.
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: PROJECTS_TITLE,
    description: PROJECTS_DESCRIPTION,
    url: `${siteUrl}/projects`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: orderedProjects.length,
      itemListElement: orderedProjects.map((p, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}/projects/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <main className={styles.main}>
      <StructuredData data={collectionJsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <div className={styles.datum} />

      {/* Zone B — Editorial Opening */}
      <section className={styles.opening}>
        <NativeReveal behavior="drift" className={styles.bgImageWrapper}>
          <HeroSlider
            images={Array.from(new Set(heroSourceProjects.map((p) => p.heroImage).filter(Boolean))) as string[]}
            alt={`AHW Architects ${activeSector !== 'All' ? activeSector : ''} projects`}
            interval={5000}
          />
        </NativeReveal>
        <div className={styles.content}>
          <Breadcrumbs items={breadcrumbs} variant="onDark" />
          <NativeReveal behavior="wipe" as="span" className={styles.eyebrow}>PROJECTS</NativeReveal>
          <NativeReveal behavior="wipe" as="h1" delay={0.1} className={styles.title}>{currentCopy.title}</NativeReveal>
          <NativeReveal behavior="fade" as="p" delay={0.2} className={styles.description}>
            {currentCopy.desc}
          </NativeReveal>
          <NativeReveal behavior="fade" delay={0.3} className={styles.metrics}>
            <span className={styles.metricItem}>{totalProjects}+ delivered projects</span>
            <span className={styles.metricItem}>{totalArea.toLocaleString()} m² fitted out</span>
            <span className={styles.metricItem}>{totalMarkets} markets</span>
          </NativeReveal>
        </div>
      </section>

      {/* Zone C — Filter Bar */}
      <ProjectFilterBar 
        activeSector={activeSector} 
        activeMarket={activeMarket} 
        resultCount={filteredProjects.length} 
      />

      {/* Zone D — Projects Index (The Ledger) */}
      <section className={styles.index}>
        {renderProjectIndex(orderedProjects)}
      </section>

      {/* Zone E — Closing / Conversion */}
      <section className={styles.closing}>
        <div className={styles.surveyMark} />
        <h2 className={styles.closingCopy}>Your project belongs on this page.</h2>
        <Link href="/contact" className={styles.primaryAction}>
          Start a conversation →
        </Link>
        <Link href="/documents/ahw-company-profile.pdf" target="_blank" className={styles.secondaryAction}>
          Download company profile (PDF)
        </Link>
        {/* Closes the one gap in the Homepage → Expertise → Projects
            internal-link chain: this page previously had no link back to
            /expertise at all. */}
        <Link href="/expertise" className={styles.secondaryAction}>
          Explore our expertise: architecture, interior design & fit-out →
        </Link>
      </section>
    </main>
  );
}

// Helper to render the rhythm
function renderProjectIndex(projects: Project[]) {
  return projects.map((p) => {
    // Collect all images for the slider
    let projectImages: string[] = [];
    if (p.caseStudy) {
      projectImages = Array.from(new Set([
        p.hubFlagshipImage,
        p.heroImage,
        ...(p.caseStudy.design?.images || []),
        ...(p.caseStudy.build?.images || []),
        ...(p.caseStudy.result?.images || [])
      ])).filter(Boolean) as string[];
    } else {
      projectImages = Array.from(new Set([p.hubFlagshipImage, p.heroImage, p.ogImage])).filter(Boolean) as string[];
    }

    // Deterministic staggered interval between 3500 and 5000 based on project ID length/number
    const stagger = parseInt(p.id.replace(/\D/g, '')) || 0;
    const staggeredInterval = 3500 + (stagger % 4) * 500;

    // Render every project as a rich visual card. Flagship-tier projects
    // get a visibly larger image cell (deliberate rhythm, not a uniform
    // grid) — the same tier signal already used for "Featured" in the nav
    // and for the display-order sort, not a new, separate ranking.
    const isFlagship = p.tier === 'Flagship';
    return (
      <div key={p.id} className={`${styles.flagshipRow} ${isFlagship ? styles.flagshipRowLarge : ''}`}>
        <Link href={`/projects/${p.slug}`} className={styles.projectLink}>
          {projectImages.length > 0 && (
            <div className={`${styles.flagshipImageWrapper} ${isFlagship ? styles.flagshipImageWrapperLarge : ''}`}>
              <HeroSlider
                images={projectImages}
                alt={p.title}
                interval={staggeredInterval}
                sizes={isFlagship ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 50vw, 100vw'}
              />
            </div>
          )}
          <div className={styles.projectMeta} style={{ marginTop: 'var(--space-6)' }}>
            <h2 className={styles.flagshipTitle}>{p.title}</h2>
            <span className={styles.projectDetails}>{p.sector} · {p.city}</span>
            {p.resultStatement && <p className={styles.resultStatement}>{p.resultStatement}</p>}
          </div>
        </Link>
      </div>
    );
  });
}
