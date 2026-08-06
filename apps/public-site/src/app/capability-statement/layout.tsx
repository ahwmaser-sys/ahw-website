import type { Metadata } from 'next';

const title = 'Capability Statement';
const description =
  'AHW Architects’ core competencies, delivery process, and selected work across Egypt and Kuwait — for developers, corporate clients, and decision-makers.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/capability-statement',
  },
  openGraph: {
    title: `${title} | AHW Architects`,
    description,
    url: '/capability-statement',
    images: [{ url: '/homepage-assets/hero/04-ahw-hero-background.jpg', width: 1200, height: 630, alt: 'AHW Architects Capability Statement' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | AHW Architects`,
    description,
    images: ['/homepage-assets/hero/04-ahw-hero-background.jpg'],
  },
};

export default function CapabilityStatementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
