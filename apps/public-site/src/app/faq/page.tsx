import type { Metadata } from 'next';
import { LegalPage, StructuredData, faqItems, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getSiteUrl } from '../../lib/site-config';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'FAQ' },
];

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about AHW Architects’ design & build model, services, offices in Egypt and Kuwait, project timelines, and how to get started.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions',
    description: 'Common questions about AHW Architects’ design & build model, services, offices in Egypt and Kuwait, project timelines, and how to get started.',
    url: '/faq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions',
    description: 'Common questions about AHW Architects’ design & build model, services, offices in Egypt and Kuwait, project timelines, and how to get started.',
  },
};

export default async function FaqPage() {
  const siteUrl = await getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <LegalPage
        title="Frequently Asked Questions"
        lastUpdated="1 August 2026"
        intro="Answers to the questions we hear most often about how AHW Architects works. Have something else in mind? Reach out on the Contact page."
        breadcrumbs={breadcrumbs}
        sections={faqItems.map((item) => ({
          heading: item.question,
          body: <p>{item.answer}</p>,
        }))}
      />
    </>
  );
}
