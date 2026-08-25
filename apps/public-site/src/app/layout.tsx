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

// The root layout renders Footer/FloatingContactHub/Organization JSON-LD
// (PublicChrome, below) on every public page — real office data (phones,
// WhatsApp, addresses) fetched from the database. Any route that doesn't
// declare its own `revalidate`/`dynamic` inherits Next.js's default
// (fully static, baked in at build time) for its whole render tree,
// including this shared layout content. Confirmed live via an actual
// Admin edit: /about, /faq, /expertise, and others kept showing a phone
// number for minutes after it was changed and restored in Admin — only
// routes that already forced their own dynamic/ISR behavior (the
// homepage's own revalidate below is a separate, pre-existing 30s
// window for a different reason; /contact is inherently dynamic) stayed
// fresh. This is the one place to fix it for every route that doesn't
// set a stricter value of its own — Next.js's segment config inherits
// down the layout tree, so this becomes the site-wide floor.
export const revalidate = 30;

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
      default: 'AHW Architects Masr | Design & Build Company in Egypt',
    },
    description: 'AHW Architects Masr is a design & build company serving Egypt, Kuwait, and the wider GCC — architecture, interior design, engineering, and interior fit-out delivered as one turnkey project, from concept to final handover.',
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
      title: 'AHW Architects Masr | Design & Build Company in Egypt',
      description: 'Architecture, interior design, engineering, and interior fit-out delivered as one turnkey project, from concept to final handover.',
      url: siteUrl,
      siteName: 'AHW Architects',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'AHW Architects Masr | Design & Build Company in Egypt',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AHW Architects Masr | Design & Build Company in Egypt',
      description: 'Architecture, interior design, engineering, and interior fit-out delivered as one turnkey project, from concept to final handover.',
      images: ['/og-image.jpg'],
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  };
}

import { SpeedInsights } from '@vercel/speed-insights/next';
import { NavigationHeader } from '../components/NavigationHeader';
import { PublicChrome } from '../components/PublicChrome';
import { GoogleAnalytics } from '../components/GoogleAnalytics';
import { AttributionCapture } from '../features/contact/components/AttributionCapture';
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
  // Egypt's profiles are ordered first (independent of prismaOffices'
  // own display sortOrder, which stays Kuwait-first everywhere a visitor
  // sees it) so a tool that just grabs "the first Instagram/LinkedIn URL"
  // in this array links Egypt's account, not Kuwait's.
  const socialOrderedOffices = [...prismaOffices].sort((a, b) =>
    (a.slug === 'egypt' ? 0 : 1) - (b.slug === 'egypt' ? 0 : 1)
  );
  const sameAs = socialOrderedOffices.flatMap((office) => {
    const social = officeSocialLinks(office);
    return [social.instagram, social.facebook, social.linkedin].filter((url): url is string => Boolean(url));
  });

  // Stable @id anchors so Organization and WebSite are the same entity on
  // every page (not a fresh anonymous node each render) — WebSite.publisher
  // references Organization by @id rather than repeating it, which is the
  // baseline for search engines/LLMs to resolve one coherent AHW entity
  // graph instead of many disconnected JSON-LD blobs across the site.
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: 'AHW Architects',
    legalName,
    url: siteUrl,
    // ahw-brand-icon.png (dedicated square 512x512 mark), not the wide
    // 1571x592 logo-dark used in the Header/Footer — Google recommends a
    // roughly-square Organization logo for clean Knowledge Panel
    // rendering; the wide wordmark crops awkwardly there. This is a
    // separate, machine-facing asset — it never touches the visual
    // Header/Footer logo.
    logo: `${siteUrl}/images/ahw-brand-icon.png`,
    // Distinct from `logo` (the brand mark) — Google's Rich Results Test
    // flags a plain Organization/ProfessionalService with no `image` as a
    // non-critical issue. Reusing the same photo already used for social
    // share previews (og-image.jpg) rather than introducing a second,
    // separate "representative image" concept.
    image: `${siteUrl}/og-image.jpg`,
    foundingDate: '2012',
    description: 'AHW Architects Masr is a design & build company — architecture, interior design, structural engineering, and interior fit-out delivered as one turnkey project across Egypt, Kuwait, and the wider GCC.',
    sameAs,
    location: offices.map((office) => ({
      '@type': 'Place',
      name: office.displayName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: office.address.street,
        addressLocality: office.address.city,
        // No postalCode field exists anywhere in the actual data model
        // (not in the Office Prisma model, not in this shared Office
        // type) — AHW's offices are never given one to enter. A prior
        // change here referenced office.address.postalCode, which never
        // existed and was always undefined; removed rather than
        // fabricating a field with no real data behind it.
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
    '@id': websiteId,
    name: 'AHW Architects',
    url: siteUrl,
    publisher: { '@id': organizationId },
  };

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GoogleAnalytics />
        <AttributionCapture />
        <a href="#main-content" className="skipLink">Skip to content</a>
        <StructuredData data={organizationJsonLd} />
        <StructuredData data={websiteJsonLd} />
        <NavigationHeader />
        <div id="app-root">
          <div id="main-content">{children}</div>
        </div>
        <PublicChrome offices={offices} copyrightText={footerSettings?.copyrightText} />
        <SpeedInsights />
      </body>
    </html>
  );
}

