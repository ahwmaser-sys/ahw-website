/**
 * The share image every page falls back to, and the reason this file exists.
 *
 * THE BUG THIS PREVENTS
 * The root layout already sets `openGraph.images`. Next.js does NOT deep-merge
 * metadata: a page that exports its own `openGraph` REPLACES the parent object
 * outright, images included. So every page that set `openGraph: { title,
 * description, url }` to get a better title silently gave up its share image.
 *
 * That was nine files and eleven URLs -- /projects, /expertise, /contact and
 * the rest -- each sharing on WhatsApp, LinkedIn and Facebook as a bare link
 * with no picture. For a practice whose work is the photography, those are the
 * links most worth sharing.
 *
 * Nothing in the type system catches it: `openGraph` without `images` is
 * perfectly valid, and the page still renders. Keeping the image behind one
 * named import at least makes the omission visible at the call site.
 *
 * WHY A JPEG AND NOT ONE OF THE AVIFs
 * The site's own images are pre-generated AVIF, which is right for browsers
 * and wrong here: the social scrapers that fetch og:image are not browsers,
 * and several still do not decode AVIF. A link whose preview fails is worse
 * than a generic one, so this stays a 1200x630 JPEG -- the size Facebook,
 * LinkedIn, X and WhatsApp all document.
 */

export const OG_IMAGE_PATH = '/og-image.jpg';

/**
 * `openGraph.images` for a page, with alt text describing THAT page.
 *
 * The alt is required rather than defaulted: a share card is read aloud by
 * screen readers on several platforms, and "AHW Architects" on every one of
 * them tells a listener nothing about which link they are about to open.
 */
export function ogImages(alt: string) {
  return [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt }];
}

/** `twitter.images` — the same file, which X expects as a bare URL list. */
export const twitterImages = [OG_IMAGE_PATH];
