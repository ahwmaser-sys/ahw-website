import type { Metadata } from 'next';
import { DisciplinePage, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise', href: '/expertise' },
  { label: 'Fit-Out' },
];

export const metadata: Metadata = {
  title: 'Interior Fit-Out Company in Egypt & Kuwait | Turnkey Delivery',
  description: 'Premium turnkey interior fit-out spanning retail design, hospitality design, and commercial design — authority approvals, installations, and handover across Egypt and the Gulf.',
  alternates: {
    canonical: '/expertise/fit-out',
  },
  openGraph: {
    title: 'Interior Fit-Out Company in Egypt & Kuwait | Turnkey Delivery',
    description: 'Premium turnkey interior fit-out spanning retail design, hospitality design, and commercial design — authority approvals, installations, and handover across Egypt and the Gulf.',
    url: '/expertise/fit-out',
    images: [{ url: '/images/expertise/ahw_act4_built_dubai.jpg', width: 1200, height: 630, alt: 'AHW Architects — Fit-Out discipline' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interior Fit-Out Company in Egypt & Kuwait | Turnkey Delivery',
    description: 'Premium turnkey interior fit-out spanning retail design, hospitality design, and commercial design — authority approvals, installations, and handover across Egypt and the Gulf.',
    images: ['/images/expertise/ahw_act4_built_dubai.jpg'],
  },
};

export default async function FitOutPage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Interior Fit-Out',
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
      name: 'Fit-Out & Handover Services',
      itemListElement: ['Interior Fit-Out', 'Authority Approvals', 'Final Handover', 'Retail Design', 'Commercial Design', 'Hospitality Design'].map((name) => ({
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
        numeral="IV"
        eyebrow="Fit-Out & Handover"
        title="Fit-Out"
        heroImage="/images/expertise/ahw_act4_built_dubai.jpg"
        heroStatement="The final layer of refinement. Where raw space becomes a premium, fully operational environment."
        intro="Whether it is a five-star hospitality design venue, a flagship retail design space, or a commercial design fit-out, our teams execute with absolute precision. We handle authority approvals and complex installations, ensuring you step into a flawless space."
        services={[
          { number: '13', name: 'Interior Fit-Out', proposition: 'Premium, turnkey interior completions built to the highest standards.' },
          { number: '14', name: 'Authority Approvals', proposition: 'Navigating regulatory frameworks to ensure compliant, seamless handover.' },
          { number: '15', name: 'Final Handover', proposition: 'The moment a vision becomes a functioning reality.' },
        ]}
        feature={{
          title: 'Uncompromising Delivery',
          description: 'Whether it is a five-star hospitality venue or a flagship retail space, our fit-out teams execute with absolute precision. We handle authority approvals and complex installations, ensuring you step into a flawless space.',
          image: '/images/expertise/ahw_split_landscape.jpg',
          imagePosition: 'left',
        }}
        projectsHref="/projects"
        otherDisciplines={[
          { name: 'Architecture', href: '/expertise/architecture' },
          { name: 'Interior Design', href: '/expertise/interior-design' },
          { name: 'Design & Build', href: '/expertise/design-build' },
          { name: 'Engineering & Project Management', href: '/expertise/engineering-project-management' },
        ]}
      />
    </>
  );
}
