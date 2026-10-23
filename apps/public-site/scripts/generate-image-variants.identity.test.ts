import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * The variant generator's whole contract is that a width-only resize keeps the
 * source aspect ratio and never enlarges — "no cropping, no distortion", which
 * is the requirement the pre-generated images were built to meet.
 *
 * sharp is being upgraded for two advisories in its bundled codecs. If that
 * changed a resize default, the next build would silently re-encode ~5,800
 * files and nobody would notice until a photo looked wrong on the site.
 *
 * Asserts GEOMETRY, not a golden hash: AVIF bytes may legitimately differ
 * between libavif builds, while the dimensions may not.
 */
const here = dirname(fileURLToPath(import.meta.url));

describe('image variant geometry', () => {
  it('scales to the requested width and derives the height from the source', async () => {
    const dir = join(here, '..', 'public', 'images');
    const file = (await readdir(dir)).find((f) => /\.(jpe?g|png)$/i.test(f));
    expect(file, 'needs at least one source image under public/images').toBeTruthy();

    const input = await readFile(join(dir, file!));
    const source = await sharp(input).metadata();

    // The exact settings generate-image-variants.mjs uses.
    const out = await sharp(input)
      .rotate()
      .resize({ width: 640, withoutEnlargement: true, fit: 'inside' })
      .avif({ quality: 72, effort: 2 })
      .toBuffer();
    const result = await sharp(out).metadata();

    const expectedWidth = Math.min(640, source.width!);
    expect(result.width).toBe(expectedWidth);
    expect(result.height).toBe(Math.round((source.height! * expectedWidth) / source.width!));
  });
});
