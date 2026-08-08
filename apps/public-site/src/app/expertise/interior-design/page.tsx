import type { Metadata } from 'next';
import { DisciplinePage, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise', href: '/expertise' },
  { label: 'Interior Design' },
];

export const metadata: Metadata = {
  title: 'Interior Design Firm in Egypt & Kuwait | Structural & Interior Engineering',
  description: 'Bespoke interior design and luxury interiors backed by structural engineering, space planning, landscape design, and MEP coordination — delivered across Egypt, Kuwait, and the Gulf.',
  alternates: {
    canonical: '/expertise/interior-design',
  },
  openGraph: {
    title: 'Interior Design Firm in Egypt & Kuwait | Structural & Interior Engineering',
    description: 'Bespoke interior design and luxury interiors backed by structural engineering, space planning, landscape design, and MEP coordination — delivered across Egypt, Kuwait, and the Gulf.',
    url: '/expertise/interior-design',
    images: [{ url: '/images/expertise/ahw_act2_built.jpg', width: 1200, height: 630, alt: 'AHW Architects — Interior Design discipline' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interior Design Firm in Egypt & Kuwait | Structural & Interior Engineering',
    description: 'Bespoke interior design and luxury interiors backed by structural engineering, space planning, landscape design, and MEP coordination — delivered across Egypt, Kuwait, and the Gulf.',
    images: ['/images/expertise/ahw_act2_built.jpg'],
  },
};

export default async function InteriorDesignPage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Interior Design & Structural Engineering',
    provider: {
      '@type': 'ProfessionalService',
      name: 'AHW Architects',
      url: siteUrl,
    },
    areaServed: [
      { '@type': 'Country', name: 'Egypt' },
      { '@type': 'Country', name: 'Kuwait' },
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'AdministrativeArea', name: 'GCC' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Interior & Engineering Services',
      itemListElement: ['Structural Engineering', 'Engineering Design', 'Interior Design', 'Landscape Architecture', 'Landscape Design', 'BIM Coordination', 'MEP Coordination', 'Space Planning', 'Luxury Interiors', 'Bespoke Joinery', 'Hospitality Design', 'Workplace Design', 'Office Design'].map((name) => ({
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
        intro="Beautiful spaces demand rigorous engineering design. By integrating our interior design and structural teams from day one, we eliminate friction between aesthetic intent and technical reality — across hospitality design, workplace design, office design, and luxury residential interiors."
        services={[
          { number: '04', name: 'Structural Engineering', proposition: 'The invisible strength that makes extraordinary architecture possible.' },
          { number: '05', name: 'Interior Design', proposition: 'Curating deeply personal, luxury interiors through space planning and bespoke joinery.' },
          { number: '06', name: 'Landscape Architecture', proposition: 'Sculpting the natural environment through landscape design that complements the built form.' },
          { number: '07', name: 'BIM Coordination', proposition: 'Clash-free digital modeling and MEP coordination to guarantee flawless on-site execution.' },
        ]}
        feature={{
          title: 'The Engineering of Elegance',
          description: 'Beautiful spaces demand rigorous engineering. By integrating our interior design and structural engineering teams from day one, we eliminate friction between aesthetic intent and technical reality. The result is seamless execution across commercial, hospitality, and premium residential sectors.',
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
