import type { Metadata } from 'next';
import { DisciplinePage, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Expertise', href: '/expertise' },
  { label: 'Design & Build' },
];

export const metadata: Metadata = {
  title: 'Design-Build Contractor in Egypt & Kuwait | Project Management',
  description: 'One point of accountability from concept to completion — design-build delivery, project management, procurement, and site supervision across Egypt and the Gulf.',
  alternates: {
    canonical: '/expertise/design-build',
  },
  openGraph: {
    title: 'Design-Build Contractor in Egypt & Kuwait | Project Management',
    description: 'One point of accountability from concept to completion — design-build delivery, project management, procurement, and site supervision across Egypt and the Gulf.',
    url: '/expertise/design-build',
    images: [{ url: '/images/expertise/ahw_act3_built.jpg', width: 1200, height: 630, alt: 'AHW Architects — Design & Build discipline' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Design-Build Contractor in Egypt & Kuwait | Project Management',
    description: 'One point of accountability from concept to completion — design-build delivery, project management, procurement, and site supervision across Egypt and the Gulf.',
    images: ['/images/expertise/ahw_act3_built.jpg'],
  },
};

export default async function DesignBuildPage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Design-Build & Construction Management',
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
      name: 'Design & Build Services',
      itemListElement: ['Design & Build', 'Project Management', 'Procurement', 'Site Supervision', 'Construction Management', 'Turnkey Projects'].map((name) => ({
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
        numeral="III"
        eyebrow="Design & Build"
        title="Design & Build"
        heroImage="/images/expertise/ahw_act3_built.jpg"
        heroStatement="We do not just hand over drawings. We take full accountability for the physical realization of the project."
        intro="A singular point of responsibility from concept to completion. Our construction management and turnkey project delivery model means we manage the grit of the construction site to protect the purity of the design, overseeing timeline, budget, and complex logistics."
        services={[
          { number: '08', name: 'Design & Build', proposition: 'A singular point of responsibility from concept to completion, delivered as turnkey projects.' },
          { number: '09', name: 'Project Management', proposition: 'Rigorous oversight of timeline, budget, and complex logistics.' },
          { number: '10', name: 'Procurement', proposition: 'Global sourcing of premium materials and bespoke FF&E.' },
          { number: '11', name: 'Site Supervision', proposition: 'Hands-on construction management to ensure the built form perfectly matches the design intent.' },
        ]}
        feature={{
          title: 'Construction Craftsmanship',
          description: 'True luxury is found in the millimeters. We manage the grit of the construction site to protect the purity of the design.',
          image: '/images/expertise/ahw_act3_site.jpg',
          imagePosition: 'left',
        }}
        projectsHref="/projects"
        otherDisciplines={[
          { name: 'Architecture', href: '/expertise/architecture' },
          { name: 'Interior Design', href: '/expertise/interior-design' },
          { name: 'Fit-Out', href: '/expertise/fit-out' },
          { name: 'Engineering & Project Management', href: '/expertise/engineering-project-management' },
        ]}
      />
    </>
  );
}
