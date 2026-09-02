// Shared mapping logic between scripts/migrate-publications.ts (local
// verification, DATABASE_URL not reachable from a local shell against
// production — see that script's own comment) and the in-app
// admin-triggered import action (actions/publications.ts), which is how
// the real one-time production import runs. Kept in its own file so
// both call sites stay byte-identical, same pattern as
// portfolio-legacy-import.ts.

// Direct relative source path, NOT the package barrel ('@agp/ui-components')
// — the barrel re-exports every component, including ones with .module.css
// imports that neither this app's tsc/ESLint synthetic project nor a plain
// tsx/Node ESM run (used by the standalone migration script) can resolve.
// Same reasoning as portfolio-legacy-import.ts's own imports.
import { publications } from '../../../../../packages/ui-components/src/data/publications';
import type { Prisma } from '@prisma/client';

export { publications };

// Straightforward 1:1 field mapping — unlike the Portfolio migration,
// there are no enum translations or curated sort order to compute here.
export function buildCreateData(pub: (typeof publications)[number]): Prisma.PublicationCreateInput {
  return {
    slug: pub.slug,
    outlet: pub.outlet,
    title: pub.title,
    excerpt: pub.excerpt,
    date: new Date(pub.date),
    url: pub.url,
    status: 'PUBLISHED',
    ...(pub.content ? { content: pub.content } : {}),
    ...(pub.coverImage ? { coverImageUrl: pub.coverImage } : {}),
    ...(pub.coverImageCaption ? { coverImageCaption: pub.coverImageCaption } : {}),
    relatedProjectSlugs: pub.relatedProjectSlugs ?? [],
    tags: pub.tags ?? [],
    isFeatured: pub.isFeatured ?? false,
    ...(pub.readingTime ? { readingTime: pub.readingTime } : {}),
  };
}
