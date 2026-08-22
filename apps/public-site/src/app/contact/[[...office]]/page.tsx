import { ContactSection } from '../../../features/contact/components/ContactSection';
import { getActiveOfficesForDisplay } from '../../../lib/portal/offices';
import { getSiteUrl } from '../../../lib/site-config';
import type { Metadata } from 'next';

type ContactPageProps = {
  params: Promise<{ office?: string[] }>;
  searchParams: Promise<{ office?: string }>;
};

// Deep-linkable two ways: the existing path segment (/contact/egypt) and
// the ?office=egypt query param the brief asks for explicitly (so the
// footer, or any other external link, can point at a specific office
// without needing a path-based route for it). Path segment wins if both
// are somehow present.
async function resolveOfficeParam(props: ContactPageProps): Promise<string> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([props.params, props.searchParams]);
  return resolvedParams.office?.[0] || resolvedSearchParams.office || '';
}

export async function generateMetadata(props: ContactPageProps): Promise<Metadata> {
  const [officeParam, offices] = await Promise.all([resolveOfficeParam(props), getActiveOfficesForDisplay()]);
  const office = offices.find((o) => o.id === officeParam);

  if (office) {
    const title = `Contact Our ${office.country} Office`;
    const description = `Reach AHW Architects' ${office.displayName} in ${office.address.city}. Request a consultation for architecture, interior design, and design-build fit-out projects.`;
    return {
      title,
      description,
      alternates: {
        canonical: `/contact/${office.id}`,
      },
      openGraph: { title, description, url: `/contact/${office.id}` },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  const officeNames = offices.map((o) => o.country).join(' & ');
  const title = `Contact Us | ${officeNames} Offices`;
  const description = `Connect with AHW Architects. Request a consultation for architecture, interior design, and design-build fit-out projects across our offices: ${officeNames}.`;
  return {
    title,
    description,
    alternates: {
      canonical: '/contact',
    },
    openGraph: { title, description, url: '/contact' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ContactPage(props: ContactPageProps) {
  const [officeParam, offices, siteUrl] = await Promise.all([resolveOfficeParam(props), getActiveOfficesForDisplay(), getSiteUrl()]);

  // Extends the SAME Organization node the root layout already declares
  // (same @id) rather than redeclaring name/url/logo/image and creating a
  // second, unlinked Organization entity on this page — verified live
  // that both scripts render on /contact, and without a shared @id they
  // read as two different organizations describing the same business.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    // Each real office becomes its own stable, addressable local entity
    // (own @id, own /contact/{office} url, own country-scoped areaServed)
    // — nested under Organization via `department` and pointing back via
    // `parentOrganization`, so Egypt and Kuwait are legible as distinct
    // local businesses that both belong to the same AHW Architects
    // organization, not one merged listing and not two disconnected ones.
    // No `geo` (GeoCoordinates): the office data model only stores a
    // Google Maps link (`hasMap`), not raw lat/long — adding one would
    // mean fabricating coordinates.
    department: offices.map((office) => ({
      '@type': 'LocalBusiness',
      '@id': `${siteUrl}/#office-${office.id}`,
      name: office.displayName,
      url: `${siteUrl}/contact/${office.id}`,
      image: `${siteUrl}/og-image.jpg`,
      parentOrganization: { '@id': `${siteUrl}/#organization` },
      address: {
        '@type': 'PostalAddress',
        streetAddress: office.address.street,
        addressLocality: office.address.city,
        ...(office.address.postalCode ? { postalCode: office.address.postalCode } : {}),
        addressCountry: office.country,
      },
      areaServed: { '@type': 'Country', name: office.country },
      telephone: office.contact.phones[0],
      email: office.contact.primaryEmail,
      openingHours: office.workingHours,
      hasMap: office.address.mapLink,
      sameAs: [office.contact.instagram, office.contact.facebook, office.contact.linkedin].filter(Boolean),
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactSection initialOfficeId={officeParam} offices={offices} siteUrl={siteUrl} />
    </main>
  );
}
