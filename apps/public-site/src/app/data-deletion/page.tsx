import type { Metadata } from 'next';
import { LegalPage } from '@agp/ui-components';
import { getLegalPage } from '../../lib/portal/legal-pages';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Data Deletion' },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage('DATA_DELETION');
  return {
    title: page.title,
    description: 'How to request deletion of your personal information.',
    alternates: { canonical: '/data-deletion' },
    robots: { index: false, follow: true },
  };
}

export default async function DataDeletionPage() {
  const page = await getLegalPage('DATA_DELETION');
  return (
    <LegalPage
      title={page.title}
      lastUpdated={page.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      breadcrumbs={breadcrumbs}
      sections={[{ body: <p style={{ whiteSpace: 'pre-line' }}>{page.body}</p> }]}
    />
  );
}
