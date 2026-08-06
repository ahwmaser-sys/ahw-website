import sharp from 'sharp';

export interface CropRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

// sharp.strategy.attention crops toward the region of highest visual
// "energy" (edges/contrast/saliency) rather than a naive center-crop — for
// architectural photography this reliably keeps a building's facade or a
// room's focal point in frame instead of cropping into plain sky or wall.
// It is not semantic (it doesn't know "this is a building"), which is why
// MediaAssetVariant.cropRegion exists: an editor can override the
// automatic crop per output, and that override is what future
// regenerations use instead of re-running attention detection.
export async function smartCropToBuffer(
  source: Buffer,
  target: { width: number; height: number },
  cropRegion?: CropRegion
): Promise<Buffer> {
  if (cropRegion) {
    return sharp(source)
      .extract({ left: Math.round(cropRegion.left), top: Math.round(cropRegion.top), width: Math.round(cropRegion.width), height: Math.round(cropRegion.height) })
      .resize({ width: target.width, height: target.height, fit: 'fill' })
      .jpeg({ quality: 88 })
      .toBuffer();
  }

  return sharp(source)
    .resize({
      width: target.width,
      height: target.height,
      fit: 'cover',
      position: sharp.strategy.attention,
    })
    .jpeg({ quality: 88 })
    .toBuffer();
}
