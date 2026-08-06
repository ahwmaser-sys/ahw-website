import { newsItems as staticNewsItems, type NewsItem } from '@agp/ui-components';
import { prisma } from './db';

// Bridges the new admin-authored NewsPost table into the existing
// public /insights/news pages. staticNewsItems (packages/ui-components)
// is currently an empty array reserved for hand-written entries — this
// merges it with anything published from the admin panel rather than
// replacing it, so nothing about the existing (currently empty) news
// system changes shape, and adding a real static entry later still
// works exactly as before.
export async function getPublicNewsItems(): Promise<NewsItem[]> {
  const posts = await prisma.newsPost.findMany({
    where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: 'desc' },
  });

  const dbItems: NewsItem[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.body,
    date: (post.publishedAt ?? post.createdAt).toISOString(),
    slug: post.slug,
  }));

  return [...dbItems, ...staticNewsItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
