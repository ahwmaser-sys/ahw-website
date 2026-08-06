import { publications } from '@agp/ui-components';
import { getPublicNewsItems } from '../../../lib/portal/public-news';
import { getSiteUrl } from '../../../lib/site-config';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const [newsItems, baseUrl] = await Promise.all([getPublicNewsItems(), getSiteUrl()]);

  const publicationEntries = publications.map((p) => ({
    title: `${p.outlet}: ${p.title}`,
    link: `${baseUrl}/insights/publications/${p.slug}`,
    description: p.excerpt,
    date: p.date,
  }));

  const newsEntries = newsItems.map((n) => ({
    title: n.title,
    link: `${baseUrl}/insights/news/${n.slug}`,
    description: n.excerpt,
    date: n.date,
  }));

  const items = [...publicationEntries, ...newsEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const itemsXml = items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid>${item.link}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
    </item>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AHW Architects — Insights</title>
    <link>${baseUrl}/insights</link>
    <description>Publications, press features, and company news from AHW Architects.</description>
    <language>en</language>${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
