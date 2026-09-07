'use client';

// Custom next/image loader.
//
// Returning a plain static URL here is what takes Vercel's Image Optimization
// out of the request path entirely. next/image normally emits
// `/_next/image?url=...&w=...&q=...`, and Vercel bills a transformation for
// every (source, width, quality) triple on a cache MISS or STALE — 5,000/month
// on Hobby, re-billed roughly monthly because variants expire. Exhausting that
// makes Vercel answer 402 and the browser shows alt text instead of the photo,
// which is the outage this site already had.
//
// With this loader the browser asks for a file that scripts/generate-image-variants.mjs
// already wrote at build time. Nothing is transformed on demand, nothing is
// billed, and the number of projects the site can carry stops being capped.
//
// THE PATH BUILT HERE MUST MATCH `variantPath()` IN THE GENERATOR EXACTLY.
// The generator writes public/_img/<relative source path>.<width>.avif, and it
// writes a file for EVERY width — including widths larger than the source,
// where the content is just the source's own size (it never upscales). That
// guarantee is what lets this function run in the browser without being able
// to check whether a file exists.

// Sources that must never be rewritten to a pre-generated variant.
function isExternal(src) {
  return /^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:');
}

export default function imageLoader({ src, width, quality }) {
  // Remote images (Vercel Blob, uploaded media served through /api/media, any
  // third-party host) have no build-time variant — there is no file on disk to
  // pre-generate from. Hand them back untouched so they load directly from
  // their origin.
  if (!src || isExternal(src)) {
    return src;
  }

  // SVG is already resolution-independent; rasterising it would be a
  // downgrade. GIF is usually animated and would lose its animation.
  if (/\.(svg|gif)$/i.test(src)) {
    return src;
  }

  // Uploaded media (Media Library -> /api/media/<id>) has no build-time file,
  // but the media pipeline writes the same width-only display variants on
  // upload. Ask for one; the route falls back to the original if that width
  // was never generated.
  if (src.startsWith('/api/media/')) {
    const [path, query] = src.split('?');
    const params = new URLSearchParams(query || '');
    // A social crop requested explicitly (?variant=) wins -- it is a
    // deliberate aspect ratio, not a display width.
    if (params.has('variant')) return src;
    params.set('w', String(width));
    return `${path}?${params.toString()}`;
  }

  // Anything else not under public/ (already-hashed /_next/static assets, or
  // any other /api route) is served as-is.
  if (!src.startsWith('/') || src.startsWith('/_next/') || src.startsWith('/api/')) {
    return src;
  }

  // Already a generated variant — do not nest.
  if (src.startsWith('/_img/')) {
    return src;
  }

  // `quality` is intentionally ignored: every variant is encoded once, at a
  // single AVIF quality chosen in the generator. Honouring it would multiply
  // the number of files for no visible benefit, and it is the second half of
  // the cache key that made this expensive on Vercel in the first place.
  void quality;

  const clean = src.split('?')[0].split('#')[0];
  return `/_img${clean}.${width}.avif`;
}
