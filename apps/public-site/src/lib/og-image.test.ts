import { describe, it, expect } from 'vitest';
import { ogImages, twitterImages, OG_IMAGE_PATH } from './og-image';

describe('ogImages', () => {
  it('produces the shape Facebook, LinkedIn and WhatsApp read', () => {
    expect(ogImages('Projects by AHW Architects')).toEqual([
      { url: '/og-image.jpg', width: 1200, height: 630, alt: 'Projects by AHW Architects' },
    ]);
  });

  it('stays a JPEG', () => {
    // The site's own images are AVIF, which several social scrapers still do
    // not decode. A preview that fails is worse than a generic one.
    expect(OG_IMAGE_PATH.endsWith('.jpg')).toBe(true);
    expect(twitterImages).toEqual([OG_IMAGE_PATH]);
  });
});
