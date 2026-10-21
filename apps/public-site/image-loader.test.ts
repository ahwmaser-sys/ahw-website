import { describe, it, expect } from 'vitest';
// The loader is plain JS (next.config.js references it by path, so it cannot
// be TypeScript). It takes next/image's loader argument and returns a URL.
import loader from './image-loader.js';

type LoaderArgs = { src: string; width: number; quality?: number };
const call = loader as (a: LoaderArgs) => string;

const at = (src: string, width = 1200): string => call({ src, width, quality: 75 });

describe('imageLoader srcset safety', () => {
  it('encodes spaces, which otherwise break the whole srcset', () => {
    // Three real project folders have spaces. Unencoded, the browser parsed
    // "/…/18-AUREA" as the URL and "SOCIAL" as a descriptor, discarded the
    // list, and fell back to src -- the largest variant -- on every device.
    expect(at('/ahw-projects-assets/18-AUREA SOCIAL HOUSE/x.png'))
      .toBe('/_img/ahw-projects-assets/18-AUREA%20SOCIAL%20HOUSE/x.png.1200.avif');
  });

  it('encodes commas, which separate srcset entries', () => {
    expect(at('/a/b,c/y.jpg', 828)).toBe('/_img/a/b%2Cc/y.jpg.828.avif');
  });

  it('is idempotent on an already-encoded path', () => {
    // Re-encoding would turn %20 into %2520 and break paths that work today.
    const encoded = '/ahw-projects-assets/18-AUREA%20SOCIAL%20HOUSE/x.png';
    expect(at(encoded)).toBe('/_img/ahw-projects-assets/18-AUREA%20SOCIAL%20HOUSE/x.png.1200.avif');
  });

  it('leaves ordinary paths untouched', () => {
    expect(at('/images/normal.jpg', 640)).toBe('/_img/images/normal.jpg.640.avif');
  });

  it('still passes through the sources that have no generated variant', () => {
    expect(at('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
    expect(at('/logo.svg')).toBe('/logo.svg');
    expect(at('/_img/already.jpg.640.avif')).toBe('/_img/already.jpg.640.avif');
    expect(at('/api/media/abc?variant=website-hero')).toBe('/api/media/abc?variant=website-hero');
  });
});
