import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-secondary',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#14171A',
};

// The Website Domain (Settings → Brand) drives metadataBase and every
// absolute URL below — generateMetadata (not a static `metadata` export)
// specifically so this can read it from the database on every request.
// Everything else here is unaffected by that setting and stays as
// ordinary literal metadata.
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: '%s | AHW Architects',
      default: 'AHW Architects | Premium Architectural Design',
    },
    description: 'Premium MENA/GCC architecture, interior design, and fit-out practice. Modern, precise, internationally credible, regionally rooted.',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: 'AHW Architects',
      description: 'Premium MENA/GCC architecture, interior design, and fit-out practice.',
      url: siteUrl,
      siteName: 'AHW Architects',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'AHW Architects | Premium Architectural Design',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AHW Architects',
      description: 'Premium MENA/GCC architecture, interior design, and fit-out practice.',
      images: ['/og-image.jpg'],
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  };
}

import { NavigationHeader } from '../components/NavigationHeader';
import { PublicChrome } from '../components/PublicChrome';
import { GoogleAnalytics } from '../components/GoogleAnalytics';
import { StructuredData, aboutData } from '@agp/ui-components';
import { getSiteUrl } from '../lib/site-config';
import { getActiveOfficesForDisplay, officeSocialLinks, getActiveOffices } from '../lib/portal/offices';
import { getActiveBrandKit } from '../lib/portal/brand-kit';

// No SearchAction here on purpose: the site has no site-wide search page to
// point it at (only section-scoped ?q= search inside /insights/news and
// /insights/publications) — a SearchAction pointing at either would make
// Google's sitelinks search box silently search only that one section.
// Add SearchAction once a real site-wide search page exists.

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteUrl, kit, prismaOffices, offices] = await Promise.all([
    getSiteUrl(),
    getActiveBrandKit(),
    getActiveOffices(),
    getActiveOfficesForDisplay(),
  ]);
  const legalName = (kit.companyInfo as { legalName?: string } | null)?.legalName ?? 'AHW Architects';
  const footerSettings = kit.footerSettings as { copyrightText?: string } | null;

  // Social profile URLs now live per-office (Settings → Offices), not as
  // one fixed brand-level list — aggregated here from however many
  // offices actually have them set, not a hardcoded six-URL array.
  const sameAs = prismaOffices.flatMap((office) => {
    const social = officeSocialLinks(office);
    return [social.instagram, social.facebook, social.linkedin].filter((url): url is string => Boolean(url));
  });

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AHW Architects',
    legalName,
    url: siteUrl,
    logo: `${siteUrl}/images/logo-white.webp`,
    foundingDate: '2012',
    description: 'Premium MENA/GCC architecture, interior design, and fit-out practice.',
    sameAs,
    location: offices.map((office) => ({
      '@type': 'Place',
      name: office.displayName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: office.address.street,
        addressLocality: office.address.city,
        addressCountry: office.country,
      },
    })),
    founder: aboutData.leadership.map((leader) => ({
      '@type': 'Person',
      name: leader.name,
      jobTitle: leader.role,
    })),
    // Distinct from `location` (physical offices): the markets the practice
    // actually delivers projects in, per projects.ts (Egypt, Kuwait, UAE),
    // plus the broader GCC region the firm positions itself as serving.
    areaServed: [
      { '@type': 'Country', name: 'Egypt' },
      { '@type': 'Country', name: 'Kuwait' },
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'AdministrativeArea', name: 'GCC' },
    ],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AHW Architects',
    url: siteUrl,
  };

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GoogleAnalytics />
        <a href="#main-content" className="skipLink">Skip to content</a>
        <StructuredData data={organizationJsonLd} />
        <StructuredData data={websiteJsonLd} />
        <NavigationHeader />
        <div id="app-root">
          <div id="main-content">{children}</div>
        </div>
        <PublicChrome offices={offices} copyrightText={footerSettings?.copyrightText} />
      </body>
    </html>
  );
}

