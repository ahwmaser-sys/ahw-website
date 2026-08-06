import sharp from 'sharp';

// Approximation, not proper k-means clustering: downsamples to a small
// grid, buckets pixels into coarse color bins, returns the most common
// bins as hex. Cheap, zero new dependency, no network call. If this proves
// visibly wrong in practice for architectural photography (which tends to
// have flatter facades and more legible dominant colors than average photo
// content), swapping in a real clustering library later is an isolated
// change to this one function.
export async function extractDominantColors(source: Buffer, count = 4): Promise<string[]> {
  const { data, info } = await sharp(source)
    .resize(16, 16, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const buckets = new Map<string, number>();

  for (let i = 0; i + channels <= data.length; i += channels) {
    // Quantize to 32-level buckets per channel (~5 bits) so near-identical
    // pixels group together instead of each being its own unique color.
    const r = Math.round((data[i] ?? 0) / 32) * 32;
    const g = Math.round((data[i + 1] ?? 0) / 32) * 32;
    const b = Math.round((data[i + 2] ?? 0) / 32) * 32;
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, count);

  return sorted.map(([key]) => {
    const [r, g, b] = key.split(',').map(Number);
    return `#${[r ?? 0, g ?? 0, b ?? 0].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('')}`;
  });
}
