/**
 * Makes a site-relative path absolute, for use inside JSON-LD.
 *
 * Next resolves relative URLs in `metadata` (openGraph, twitter, alternates)
 * against `metadataBase`, so those are fine as-is. JSON-LD is NOT metadata —
 * it is a raw <script> the app serialises itself, so nothing resolves it and
 * Google discards structured data containing relative URLs. That is how the
 * news and publication cover images ("/api/media/<id>?variant=...") were
 * silently missing from rich results despite being present in the markup.
 *
 * Already-absolute values and data: URIs are returned untouched, so this is
 * safe to wrap around a field that may hold either shape.
 */
export function absoluteUrl(path: string, siteUrl: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  const base = siteUrl.replace(/\/+$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
