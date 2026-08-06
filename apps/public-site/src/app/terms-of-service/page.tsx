import type { Metadata } from 'next';
import { LegalPage } from '@agp/ui-components';
import { getLegalPage } from '../../lib/portal/legal-pages';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Terms of Service' },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage('TERMS_OF_SERVICE');
  return {
    title: page.title,
    description: 'The terms governing your use of this website.',
    alternates: { canonical: '/terms-of-service' },
    robots: { index: false, follow: true },
  };
}

export default async function TermsOfServicePage() {
  const page = await getLegalPage('TERMS_OF_SERVICE');
  return (
    <LegalPage
      title={page.title}
      lastUpdated={page.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      breadcrumbs={breadcrumbs}
      sections={[{ body: <p style={{ whiteSpace: 'pre-line' }}>{page.body}</p> }]}
    />
  );
}
