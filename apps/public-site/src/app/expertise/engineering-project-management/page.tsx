import type { Metadata } from 'next';
import { DisciplinePage, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise', href: '/expertise' },
  { label: 'Engineering & Project Management' },
];

export const metadata: Metadata = {
  title: 'Structural Engineering & Project Management in Egypt & Kuwait',
  description: 'AHW Architects delivers structural engineering coordination, MEP coordination, BIM clash detection, project management, and site supervision across Egypt, Kuwait, and the Gulf — the engineering discipline behind every build.',
  alternates: {
    canonical: '/expertise/engineering-project-management',
  },
  openGraph: {
    title: 'Structural Engineering & Project Management in Egypt & Kuwait',
    description: 'AHW Architects delivers structural engineering coordination, MEP coordination, BIM clash detection, project management, and site supervision across Egypt, Kuwait, and the Gulf — the engineering discipline behind every build.',
    url: '/expertise/engineering-project-management',
    images: [{ url: '/images/expertise/ahw_act3_site.jpg', width: 1200, height: 630, alt: 'AHW Architects — Engineering & Project Management discipline' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Structural Engineering & Project Management in Egypt & Kuwait',
    description: 'AHW Architects delivers structural engineering coordination, MEP coordination, BIM clash detection, project management, and site supervision across Egypt, Kuwait, and the Gulf.',
    images: ['/images/expertise/ahw_act3_site.jpg'],
  },
};

export default async function EngineeringProjectManagementPage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Structural Engineering, MEP Coordination & Project Management',
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
      name: 'Engineering & Project Management Services',
      itemListElement: ['Structural Engineering Coordination', 'MEP Coordination', 'BIM Clash Detection', 'Project Management', 'Site Supervision', 'Procurement', 'Construction Management', 'Value Engineering'].map((name) => ({
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
        numeral="V"
        eyebrow="Engineering & Delivery"
        title="Engineering & Project Management"
        heroImage="/images/expertise/ahw_act3_site.jpg"
        heroStatement="The invisible strength that makes extraordinary architecture possible. Structural integrity and disciplined project delivery, engineered in parallel with the design itself."
        intro="Structural and MEP coordination happen during design, not after — catching engineering conflicts on paper instead of on site, where they cost far more to fix. Combined with hands-on project management and site supervision, this is the engineering discipline that carries a design from drawing to a building that performs exactly as intended, across Egypt, Kuwait, and the Gulf."
        services={[
          { number: '01', name: 'Structural Engineering', proposition: 'The invisible strength that makes extraordinary architecture possible — coordinated with the design from day one, not bolted on afterward.' },
          { number: '02', name: 'MEP & BIM Coordination', proposition: 'Clash-free digital modeling across structural, mechanical, electrical, and plumbing systems to guarantee flawless on-site execution.' },
          { number: '03', name: 'Project Management', proposition: 'Rigorous oversight of timeline, budget, and complex logistics, reported at every phase rather than surfaced only at milestones.' },
          { number: '04', name: 'Site Supervision & Procurement', proposition: 'On-site presence to ensure the built form matches design intent, backed by global sourcing of premium materials and bespoke FF&E.' },
        ]}
        feature={{
          title: 'The Engineering of Elegance',
          description: 'Beautiful spaces demand rigorous engineering. By integrating structural, MEP, and project management teams from day one, AHW eliminates friction between aesthetic intent and technical reality — across commercial, hospitality, and premium residential sectors.',
          image: '/images/expertise/ahw_act2_built.jpg',
          imagePosition: 'left',
        }}
        projectsHref="/projects"
        featuredProject={{
          title: 'Beit Al Watan Smart Residential Building',
          href: '/projects/beit-al-watan-residential-new-cairo-egypt',
          sector: 'Residential',
          city: 'New Cairo, Egypt',
          image: '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-10.png',
        }}
        otherDisciplines={[
          { name: 'Architecture', href: '/expertise/architecture' },
          { name: 'Interior Design', href: '/expertise/interior-design' },
          { name: 'Design & Build', href: '/expertise/design-build' },
          { name: 'Fit-Out', href: '/expertise/fit-out' },
        ]}
      />
    </>
  );
}
