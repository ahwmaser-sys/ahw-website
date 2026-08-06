// Satori (the renderer behind next/og's ImageResponse) needs real font
// binary bytes, not a `font-family` name resolved from the OS — and
// next/font's compiled build output isn't reusable as raw bytes. Rather
// than vendor binary font files into the repo, this fetches the actual
// Inter/Outfit weights from Google Fonts' own CSS API at render time and
// caches the bytes in memory for the process lifetime — the same
// technique Vercel's own next/og documentation recommends for exactly
// this situation. Real network dependency at first render in a given
// process; documented, not hidden.
const fontCache = new Map<string, ArrayBuffer>();

async function fetchGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const cacheKey = `${family}-${weight}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const cssResponse = await fetch(cssUrl, {
    headers: {
      // Google serves TTF/OTF (Satori-compatible) to older user agents
      // instead of WOFF2 (which Satori cannot parse) — this UA string is
      // the standard workaround for that.
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
    },
  });
  if (!cssResponse.ok) {
    throw new Error(`Failed to fetch font CSS for ${family} ${weight}: ${cssResponse.status}`);
  }
  const css = await cssResponse.text();
  // The legacy-Chrome UA above makes Google skip WOFF2 (which Satori can't
  // parse), but which of woff/opentype/truetype it serves instead varies
  // by font — Outfit serves 'woff' where Inter serves 'truetype', for
  // example. Satori accepts all three uncompressed-enough formats.
  const fontUrlMatch = /src: url\((.+?)\) format\('(opentype|truetype|woff)'\)/.exec(css);
  if (!fontUrlMatch) {
    throw new Error(`Could not find a Satori-compatible font URL for ${family} ${weight}.`);
  }

  const fontResponse = await fetch(fontUrlMatch[1] ?? '');
  if (!fontResponse.ok) {
    throw new Error(`Failed to fetch font binary for ${family} ${weight}: ${fontResponse.status}`);
  }
  const buffer = await fontResponse.arrayBuffer();
  fontCache.set(cacheKey, buffer);
  return buffer;
}

// Satori only accepts these exact multiples of 100 — Brand Kit typography
// weights are free-form numbers (an admin could type 450), so this snaps
// to the nearest valid value rather than failing the render.
export type SatoriWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export function toSatoriWeight(weight: number): SatoriWeight {
  const clamped = Math.min(900, Math.max(100, weight));
  const snapped = (Math.round(clamped / 100) * 100) as SatoriWeight;
  return snapped;
}

export interface LoadedFont {
  name: string;
  data: ArrayBuffer;
  weight: SatoriWeight;
  style: 'normal';
}

export async function loadBrandFonts(primaryFont: string, secondaryFont: string, weights: number[]): Promise<LoadedFont[]> {
  const uniquePairs = new Set<string>();
  const jobs: Array<{ family: string; weight: SatoriWeight }> = [];
  for (const rawWeight of weights) {
    const weight = toSatoriWeight(rawWeight);
    for (const family of [primaryFont, secondaryFont]) {
      const key = `${family}-${weight}`;
      if (!uniquePairs.has(key)) {
        uniquePairs.add(key);
        jobs.push({ family, weight });
      }
    }
  }

  const results = await Promise.all(
    jobs.map(async ({ family, weight }) => ({
      name: family,
      data: await fetchGoogleFont(family, weight),
      weight,
      style: 'normal' as const,
    }))
  );

  return results;
}
