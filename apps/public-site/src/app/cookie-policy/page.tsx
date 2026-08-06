import type { Metadata } from 'next';
import { LegalPage } from '@agp/ui-components';
import { getLegalPage } from '../../lib/portal/legal-pages';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Cookie Policy' },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage('COOKIE_POLICY');
  return {
    title: page.title,
    description: 'How this website uses cookies and local browser storage.',
    alternates: { canonical: '/cookie-policy' },
    robots: { index: false, follow: true },
  };
}

export default async function CookiePolicyPage() {
  const page = await getLegalPage('COOKIE_POLICY');
  return (
    <LegalPage
      title={page.title}
      lastUpdated={page.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      breadcrumbs={breadcrumbs}
      sections={[{ body: <p style={{ whiteSpace: 'pre-line' }}>{page.body}</p> }]}
    />
  );
}
