import type { Metadata } from 'next';
import { DisciplinePage, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise', href: '/expertise' },
  { label: 'Interior Design' },
];

export const metadata: Metadata = {
  title: 'Interior Design Firm in Egypt & Kuwait | Residential & Commercial Interiors',
  description: 'Bespoke interior design for private residences, villas, and apartments as well as offices, retail, and hospitality spaces — backed by structural engineering, space planning, and MEP coordination across Egypt, Kuwait, and the Gulf.',
  alternates: {
    canonical: '/expertise/interior-design',
  },
  openGraph: {
    title: 'Interior Design Firm in Egypt & Kuwait | Residential & Commercial Interiors',
    description: 'Bespoke interior design for private residences, villas, and apartments as well as offices, retail, and hospitality spaces — backed by structural engineering, space planning, and MEP coordination across Egypt, Kuwait, and the Gulf.',
    url: '/expertise/interior-design',
    images: [{ url: '/images/expertise/ahw_act2_built.jpg', width: 1200, height: 630, alt: 'AHW Architects — Interior Design discipline' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interior Design Firm in Egypt & Kuwait | Residential & Commercial Interiors',
    description: 'Bespoke interior design for private residences, villas, and apartments as well as offices, retail, and hospitality spaces — backed by structural engineering, space planning, and MEP coordination across Egypt, Kuwait, and the Gulf.',
    images: ['/images/expertise/ahw_act2_built.jpg'],
  },
};

export default async function InteriorDesignPage() {
  const siteUrl = await getSiteUrl();
  const pageUrl = `${siteUrl}/expertise/interior-design`;
  // Stable @ids so this page's Service/BreadcrumbList/WebPage nodes are
  // one connected graph (WebPage --about--> Service --provider--> the
  // sitewide Organization, WebPage --isPartOf--> the sitewide WebSite,
  // WebPage --breadcrumb--> this page's own BreadcrumbList) instead of
  // three disconnected blobs that happen to sit on the same page.
  const serviceId = `${pageUrl}#service`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': serviceId,
    serviceType: 'Residential & Commercial Interior Design',
    // Reference by @id (the Organization node in layout.tsx, present on
    // every page) rather than re-describing AHW Architects as a fresh
    // entity here — see HomeContent.tsx's jsonLd comment for the full
    // reasoning.
    provider: { '@id': `${siteUrl}/#organization` },
    areaServed: [
      { '@type': 'Country', name: 'Egypt' },
      { '@type': 'Country', name: 'Kuwait' },
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'AdministrativeArea', name: 'GCC' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Residential & Commercial Interior Design Services',
      // Residential-facing items lead the list — the portfolio genuinely
      // supports both (Stone Residence, IL Bosco Villa, and others), but
      // this list previously named Hospitality/Workplace/Office
      // explicitly while never naming "Residential" as its own item,
      // which is the concrete, evidence-based reason AI systems summarized
      // this page as primarily commercial/office-focused.
      itemListElement: ['Interior Design', 'Residential Interior Design', 'Luxury Interiors', 'Space Planning', 'Bespoke Joinery', 'Structural Engineering', 'Engineering Design', 'Landscape Architecture', 'Landscape Design', 'BIM Coordination', 'MEP Coordination', 'Hospitality Design', 'Workplace Design', 'Office Design'].map((name) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name },
      })),
    },
  };

  const breadcrumbJsonLd = { ...buildBreadcrumbJsonLd(breadcrumbs, siteUrl), '@id': breadcrumbId };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: metadata.title as string,
    isPartOf: { '@id': `${siteUrl}/#website` },
    about: { '@id': serviceId },
    breadcrumb: { '@id': breadcrumbId },
  };

  return (
    <>
      <StructuredData data={webPageJsonLd} />
      <StructuredData data={jsonLd} />
      <StructuredData data={breadcrumbJsonLd} />
      <DisciplinePage
        breadcrumbs={breadcrumbs}
        numeral="II"
        eyebrow="Interior & Engineering"
        title="Interior Design"
        heroImage="/images/expertise/ahw_act2_built.jpg"
        heroStatement="From the structural skeleton to the tactile surface. Every detail is engineered for human experience and structural integrity."
        intro="From private residences and villas to hospitality, workplace, and retail interiors, every space is designed with the same rigor — integrating our interior design and structural teams from day one so aesthetic intent and technical reality move together, from Cairo to Kuwait City."
        services={[
          { number: '04', name: 'Structural Engineering', proposition: 'The invisible strength that makes extraordinary architecture possible.' },
          { number: '05', name: 'Interior Design', proposition: 'Curating deeply personal, luxury interiors for private residences, villas, and apartments alongside commercial and hospitality spaces, through space planning and bespoke joinery.' },
          { number: '06', name: 'Landscape Architecture', proposition: 'Sculpting the natural environment through landscape design that complements the built form.' },
          { number: '07', name: 'BIM Coordination', proposition: 'Clash-free digital modeling and MEP coordination to guarantee flawless on-site execution.' },
        ]}
        feature={{
          title: 'The Engineering of Elegance',
          description: 'Beautiful spaces demand rigorous engineering. By integrating our interior design and structural engineering teams from day one, we eliminate friction between aesthetic intent and technical reality. The result is seamless execution across private residences and villas as well as commercial, hospitality, and workplace sectors.',
          image: '/images/expertise/ahw_split_commercial.jpg',
          imagePosition: 'right',
        }}
        quote={{ line1: 'Design is only a promise.', line2: 'Execution is the proof.' }}
        projectsHref="/projects"
        featuredProject={{
          title: 'Stone Residence',
          href: '/projects/stone-residence-new-cairo-egypt',
          sector: 'Residential',
          city: 'New Cairo, Egypt',
          image: '/ahw-projects-assets/07-stone-residence-new-cairo/hub-flagship.jpg',
        }}
        additionalProjects={[
          {
            title: 'IL Bosco Villa',
            href: '/projects/il-bosco-villa-new-capital-egypt',
            sector: 'Residential',
            city: 'New Capital, Egypt',
            image: '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-3-atv8.jpg',
          },
        ]}
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
