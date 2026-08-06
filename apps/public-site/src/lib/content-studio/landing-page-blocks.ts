// Landing page content model — an ordered array of typed blocks stored
// as LandingPage.blocks (JSON), rendered by the one generic renderer in
// apps/public-site/src/app/lp/[slug]/page.tsx. Image blocks reference
// MediaAsset ids by string rather than a relational structure (same
// trade-off as BrandKit — see schema.prisma's comment), resolved and
// validated at render/save time, not enforced by the database.
export type LandingPageBlock =
  | { type: 'hero'; headline: string; subheadline?: string; imageAssetId?: string; ctaLabel?: string; ctaUrl?: string }
  | { type: 'text'; heading?: string; body: string }
  | { type: 'image'; assetId: string; caption?: string }
  | { type: 'cta'; label: string; url: string }
  | { type: 'gallery'; assetIds: string[] };

export function isLandingPageBlockArray(value: unknown): value is LandingPageBlock[] {
  return Array.isArray(value) && value.every((b) => typeof b === 'object' && b !== null && typeof (b as { type?: unknown }).type === 'string');
}

export function collectAssetIds(blocks: LandingPageBlock[]): string[] {
  const ids: string[] = [];
  for (const block of blocks) {
    if (block.type === 'hero' && block.imageAssetId) ids.push(block.imageAssetId);
    if (block.type === 'image') ids.push(block.assetId);
    if (block.type === 'gallery') ids.push(...block.assetIds);
  }
  return ids;
}
