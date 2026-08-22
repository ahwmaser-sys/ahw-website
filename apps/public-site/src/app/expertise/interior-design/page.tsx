import type { Metadata } from 'next';
import { DisciplinePage, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise', href: '/expertise' },
  { label: 'Interior Design' },
];

// Previously led with "Structural & Interior Engineering" — that phrase
// is /expertise/engineering-project-management's actual territory, and
// the two pages' title/description/feature copy were near-duplicates of
// each other. Retitled to lead with the keywords this page's own body
// content already targets (interior design, interior architecture,
// residential interior design — see hasOfferCatalog and `services`
// below), which also gives each expertise page a distinct search intent.
export const metadata: Metadata = {
  title: 'Interior Design & Interior Architecture in Egypt & Kuwait',
  description: 'Bespoke interior design, interior architecture, and residential interior design — from space planning to luxury interiors, backed by our in-house structural and MEP coordination — delivered across Egypt, Kuwait, and the Gulf.',
  alternates: {
    canonical: '/expertise/interior-design',
  },
  openGraph: {
    title: 'Interior Design & Interior Architecture in Egypt & Kuwait',
    description: 'Bespoke interior design, interior architecture, and residential interior design — from space planning to luxury interiors, backed by our in-house structural and MEP coordination — delivered across Egypt, Kuwait, and the Gulf.',
    url: '/expertise/interior-design',
    images: [{ url: '/images/expertise/ahw_act2_built.jpg', width: 1200, height: 630, alt: 'AHW Architects — Interior Design discipline' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interior Design & Interior Architecture in Egypt & Kuwait',
    description: 'Bespoke interior design, interior architecture, and residential interior design — from space planning to luxury interiors, backed by our in-house structural and MEP coordination — delivered across Egypt, Kuwait, and the Gulf.',
    images: ['/images/expertise/ahw_act2_built.jpg'],
  },
};

export default async function InteriorDesignPage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Interior Design & Interior Architecture',
    provider: {
      '@type': 'ProfessionalService',
      // Same @id as layout.tsx's Organization node, so this isn't read as
      // a separate, unlinked entity.
      '@id': `${siteUrl}/#organization`,
      name: 'AHW Architects',
      url: siteUrl,
      image: `${siteUrl}/og-image.jpg`,
    },
    areaServed: [
      { '@type': 'Country', name: 'Egypt' },
      { '@type': 'Country', name: 'Kuwait' },
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'AdministrativeArea', name: 'GCC' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Interior Design Services',
      itemListElement: ['Interior Design', 'Interior Architecture', 'Residential Interior Design', 'Commercial Interior Design', 'Space Planning', 'Luxury Interiors', 'Bespoke Joinery', 'Hospitality Design', 'Workplace Design', 'Office Design', 'Landscape Architecture', 'Landscape Design', 'Structural Engineering', 'Engineering Design', 'BIM Coordination', 'MEP Coordination'].map((name) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name },
      })),
    },
  };

  return (
    <>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <DisciplinePage
        breadcrumbs={breadcrumbs}
        numeral="II"
        eyebrow="Interior & Engineering"
        title="Interior Design"
        heroImage="/images/expertise/ahw_act2_built.jpg"
        heroStatement="From the structural skeleton to the tactile surface. Every detail is engineered for human experience and structural integrity."
        intro="Interior design and interior architecture, curated as one discipline — from residential interior design to commercial interior design, hospitality design, workplace design, and office design — backed by our own structural and engineering teams so aesthetic intent and technical reality are resolved together, not handed off."
        services={[
          { number: '04', name: 'Interior Design & Interior Architecture', proposition: 'Curating deeply personal, luxury interiors through space planning and bespoke joinery — as interior designers and interior architects working from the same set of drawings.' },
          { number: '05', name: 'Residential & Commercial Interior Design', proposition: 'From private residences to workplace and hospitality interiors, tailored to how each space is actually used.' },
          { number: '06', name: 'Landscape Architecture', proposition: 'Sculpting the natural environment through landscape design that complements the built form.' },
          { number: '07', name: 'In-House Structural & BIM Coordination', proposition: 'Clash-free digital modeling and MEP coordination with our own engineering team, so interior design decisions stay buildable from day one.' },
        ]}
        feature={{
          title: 'Design That Is Already Buildable',
          description: 'Every interior design decision is checked against structural and MEP reality before it reaches a drawing — not after. That in-house coordination is what lets a residential interior, a workplace fit-out, or a hospitality space go from concept to site without the redesigns that come from surprises discovered mid-construction.',
          image: '/images/expertise/ahw_split_commercial.jpg',
          imagePosition: 'right',
        }}
        quote={{ line1: 'Design is only a promise.', line2: 'Execution is the proof.' }}
        projectsHref="/projects"
        otherDisciplines={[
          { name: 'Architecture', href: '/expertise/architecture' },
          { name: 'Design & Build', href: '/expertise/design-build' },
          { name: 'Fit-Out', href: '/expertise/fit-out' },
          { name: 'Engineering & Project Management', href: '/expertise/engineering-project-management' },
        ]}
      />
    </>
  );
}
