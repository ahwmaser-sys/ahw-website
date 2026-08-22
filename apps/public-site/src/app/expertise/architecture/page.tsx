import type { Metadata } from 'next';
import { DisciplinePage, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise', href: '/expertise' },
  { label: 'Architecture' },
];

export const metadata: Metadata = {
  title: 'Architecture Firm in Egypt & Kuwait | Master Planning & Design',
  description: 'AHW Architects delivers master planning, urban design, and architecture across Egypt, Kuwait, and the Gulf — from land strategy to iconic, buildable form.',
  alternates: {
    canonical: '/expertise/architecture',
  },
  openGraph: {
    title: 'Architecture Firm in Egypt & Kuwait | Master Planning & Design',
    description: 'AHW Architects delivers master planning, urban design, and architecture across Egypt, Kuwait, and the Gulf — from land strategy to iconic, buildable form.',
    url: '/expertise/architecture',
    images: [{ url: '/images/expertise/ahw_act1_built.jpg', width: 1200, height: 630, alt: 'AHW Architects — Architecture discipline' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Architecture Firm in Egypt & Kuwait | Master Planning & Design',
    description: 'AHW Architects delivers master planning, urban design, and architecture across Egypt, Kuwait, and the Gulf — from land strategy to iconic, buildable form.',
    images: ['/images/expertise/ahw_act1_built.jpg'],
  },
};

export default async function ArchitecturePage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Architecture & Master Planning',
    provider: {
      '@type': 'ProfessionalService',
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
      name: 'Architecture Services',
      itemListElement: ['Architectural Design', 'Architectural Consultancy', 'Master Planning', 'Urban Design', 'Feasibility & Strategy', 'Renovation', 'Residential Design', 'Commercial Design'].map((name) => ({
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
        numeral="I"
        eyebrow="Strategy & Architecture"
        title="Architecture"
        heroImage="/images/expertise/ahw_act1_built.jpg"
        heroStatement="Over a decade of delivering iconic structures across the Middle East. Form is the consequence of rigorous engineering and unwavering execution."
        intro="Where master planning meets feasibility. As an architecture firm and architectural design consultancy, we organize land, budget, and purpose into a singular vision — before a single line is drawn. Our architectural design practice spans residential design, commercial design, and large-scale renovation of existing structures."
        services={[
          { number: '01', name: 'Architectural Design & Master Planning', proposition: 'Designing comprehensive urban frameworks across Mixed-Use, Residential, and Commercial sectors.' },
          { number: '02', name: 'Urban Design', proposition: 'Integrating architecture seamlessly with the public realm.' },
          { number: '03', name: 'Feasibility & Strategy', proposition: 'Ensuring every design decision is backed by strict budgetary control and spatial logic.' },
          { number: '04', name: 'Renovation', proposition: 'Reimagining existing buildings through renovation and architectural retrofit, from residential design to commercial design.' },
        ]}
        feature={{
          title: 'Sketch to Structure',
          description: 'Every project begins as a hand-drawn concept and is developed through rigorous technical study before it becomes a buildable design — ensuring ambition and feasibility move together from day one.',
          image: '/images/expertise/ahw_act1_sketch.jpg',
          imagePosition: 'left',
        }}
        projectsHref="/projects"
        otherDisciplines={[
          { name: 'Interior Design', href: '/expertise/interior-design' },
          { name: 'Design & Build', href: '/expertise/design-build' },
          { name: 'Fit-Out', href: '/expertise/fit-out' },
          { name: 'Engineering & Project Management', href: '/expertise/engineering-project-management' },
        ]}
      />
    </>
  );
}
