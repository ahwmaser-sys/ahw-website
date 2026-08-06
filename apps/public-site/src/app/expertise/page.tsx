import type { Metadata } from 'next';
import { TheDatum, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise' },
];

export const metadata: Metadata = {
  title: 'Architecture, Structural Engineering, Interior Design & Project Management Services',
  description: 'Full-service architecture, structural engineering, MEP coordination, interior design, project management, and design-build construction — spanning residential, commercial, retail, hospitality, and workplace projects across Egypt and the Gulf.',
  alternates: {
    canonical: '/expertise',
  },
  openGraph: {
    title: 'Architecture, Structural Engineering, Interior Design & Project Management Services',
    description: 'Full-service architecture, structural engineering, MEP coordination, interior design, project management, and design-build construction — spanning residential, commercial, retail, hospitality, and workplace projects across Egypt and the Gulf.',
    url: '/expertise',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Architecture, Structural Engineering, Interior Design & Project Management Services',
    description: 'Full-service architecture, structural engineering, MEP coordination, interior design, project management, and design-build construction — spanning residential, commercial, retail, hospitality, and workplace projects across Egypt and the Gulf.',
  },
};

export default async function ExpertisePage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Architecture, Interior Design & Design-Build Fit-Out',
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
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <TheDatum />
    </main>
  );
}
