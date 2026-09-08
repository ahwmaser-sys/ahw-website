import type { Metadata } from 'next';
import { TheDatum, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise' },
];

export const metadata: Metadata = {
  title: 'Architecture, Engineering & Interior Design',
  description: 'Architecture, structural engineering, interior design, project management, and design-build across Egypt and the Gulf — concept to handover.',
  alternates: {
    canonical: '/expertise',
  },
  openGraph: {
    title: 'Architecture, Engineering & Interior Design',
    description: 'Architecture, structural engineering, interior design, project management, and design-build across Egypt and the Gulf — concept to handover.',
    url: '/expertise',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Architecture, Engineering & Interior Design',
    description: 'Architecture, structural engineering, interior design, project management, and design-build across Egypt and the Gulf — concept to handover.',
  },
};

export default async function ExpertisePage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Architecture, Interior Design & Design-Build Fit-Out',
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
      name: 'AHW Architects Disciplines',
      itemListElement: [
        'Architecture',
        'Interior Design',
        'Design & Build',
        'Fit-Out',
        'Master Planning & Urban Design',
        'Project Management',
        'Retail Design',
        'Commercial Design',
        'Residential Design',
        'Hospitality Design',
        'Office Design',
        'Workplace Design',
        'Landscape Design',
        'Engineering Design',
        'Renovation',
        'Turnkey Projects',
        'Construction Management',
        'MEP Coordination',
        'Space Planning',
        'Luxury Interiors',
        'Bespoke Joinery',
        'Authority Approvals',
      ].map((name) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name },
      })),
    },
  };

  return (
    <main>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <TheDatum />
    </main>
  );
}
