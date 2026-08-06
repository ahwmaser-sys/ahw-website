import type { Metadata } from 'next';
import { LegalPage } from '@agp/ui-components';
import { getLegalPage } from '../../lib/portal/legal-pages';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Privacy Policy' },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage('PRIVACY_POLICY');
  return {
    title: page.title,
    description: 'How we collect, use, and protect your personal information.',
    alternates: { canonical: '/privacy-policy' },
    robots: { index: false, follow: true },
  };
}

export default async function PrivacyPolicyPage() {
  const page = await getLegalPage('PRIVACY_POLICY');
  return (
    <LegalPage
      title={page.title}
      lastUpdated={page.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      breadcrumbs={breadcrumbs}
      sections={[{ body: <p style={{ whiteSpace: 'pre-line' }}>{page.body}</p> }]}
    />
  );
}
