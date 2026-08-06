import { randomUUID } from 'crypto';
import { writeFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import { saveFile, isUsingBlobStorage, resolveFilePath } from '../storage';
import { validateMediaFile, type MediaAssetKind } from './validate';
import { smartCropToBuffer } from './smart-crop';
import { extractDominantColors } from './dominant-color';
import { extractVideoMetadata } from './video';
import { OUTPUT_TARGETS } from './output-targets';

export interface PipelineInput {
  buffer: Buffer;
  fileName: string;
  declaredType: string;
  kind: MediaAssetKind;
  generateVariants: boolean; // false for DOCUMENT/ICON, true for IMAGE (LOGO/VIDEO handled separately)
}

export interface PipelineVariantResult {
  purpose: string;
  storageKey: string;
  width: number;
  height: number;
}

export interface PipelineResult {
  storageKey: string;
  fileType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  orientation: 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE' | null;
  dominantColors: string[];
  durationSeconds: number | null;
  variants: PipelineVariantResult[];
}

function deriveOrientation(width: number, height: number): 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE' {
  const ratio = width / height;
  if (ratio > 1.05) return 'LANDSCAPE';
  if (ratio < 0.95) return 'PORTRAIT';
  return 'SQUARE';
}

// The full pipeline the brief requires: Validation → Optimization → Smart
// Crop → Variant Generation → Compression → Publishing (the asset row
// being created/persisted by the caller immediately after this returns is
// "publishing" in the sense of "now a usable Media Library asset" — a
// second, explicit publish step doesn't apply to raw media the way it
// does to an Article). Runs synchronously within the upload request —
// there's no background job queue in this app (apps/worker is an unbuilt
// stub), so a large batch of images will make the upload request take
// correspondingly longer rather than fail; documented, not silently
// hidden.
export async function runMediaPipeline(input: PipelineInput): Promise<PipelineResult> {
  const validation = await validateMediaFile(input.buffer, input.kind, input.declaredType, input.buffer.length);
  if (!validation.ok || !validation.mimeType) {
    throw new Error(validation.error ?? 'Validation failed.');
  }

  const assetId = randomUUID();
  const prefix = `library/${input.kind.toLowerCase()}`;

  if (input.kind === 'VIDEO') {
    const extension = validation.extension ?? 'mp4';
    const storageKey = await saveFile(`${prefix}/${assetId}.${extension}`, input.buffer);
    // ffprobe needs a real local file to read, independent of which
    // storage backend is active — in local mode that's just the path
    // saveFile already wrote to; in Blob mode there is no local path, so
    // the buffer we already have in memory is written to a throwaway OS
    // temp file just for this one read.
    const metadata = isUsingBlobStorage()
      ? await (async () => {
          const dir = await mkdtemp(join(tmpdir(), 'ahw-video-'));
          const tempPath = join(dir, `probe.${extension}`);
          await writeFile(tempPath, input.buffer);
          try {
            return await extractVideoMetadata(tempPath);
          } finally {
            await rm(dir, { recursive: true, force: true });
          }
        })()
      : await extractVideoMetadata(resolveFilePath(storageKey));
    return {
      storageKey,
      fileType: validation.mimeType,
      fileSize: input.buffer.length,
      width: metadata.width,
      height: metadata.height,
      orientation: metadata.width && metadata.height ? deriveOrientation(metadata.width, metadata.height) : null,
      dominantColors: [],
      durationSeconds: metadata.durationSeconds,
      variants: [],
    };
  }

  if (input.kind === 'DOCUMENT' || validation.mimeType === 'image/svg+xml') {
    const extension = validation.extension ?? 'bin';
    const storageKey = await saveFile(`${prefix}/${assetId}.${extension}`, input.buffer);
    return {
      storageKey,
      fileType: validation.mimeType,
      fileSize: input.buffer.length,
      width: null,
      height: null,
      orientation: null,
      dominantColors: [],
      durationSeconds: null,
      variants: [],
    };
  }

  // IMAGE / LOGO / ICON (raster) — the full image pipeline.
  const image = sharp(input.buffer).rotate(); // normalize EXIF orientation before anything else
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) {
    throw new Error('Could not read image dimensions.');
  }

  const dominantColors = await extractDominantColors(input.buffer);

  // Optimize + compress the original once (normalize orientation, strip
  // EXIF, re-encode) — kept at high quality since it's the source every
  // future variant is derived from; aggressive compression happens on the
  // delivered variants below, not the source of truth.
  const optimizedOriginal = metadata.format === 'png'
    ? await sharp(input.buffer).rotate().png({ compressionLevel: 8 }).toBuffer()
    : await sharp(input.buffer).rotate().jpeg({ quality: 94, mozjpeg: true }).toBuffer();
  const originalExtension = metadata.format === 'png' ? 'png' : 'jpg';
  const storageKey = await saveFile(`${prefix}/${assetId}.${originalExtension}`, optimizedOriginal);

  const variants: PipelineVariantResult[] = [];
  if (input.generateVariants) {
    for (const target of OUTPUT_TARGETS) {
      const cropped = await smartCropToBuffer(input.buffer, target);
      const variantKey = await saveFile(`${prefix}/${assetId}/${target.key}.jpg`, cropped);
      variants.push({ purpose: target.key, storageKey: variantKey, width: target.width, height: target.height });
    }
  }

  return {
    storageKey,
    fileType: metadata.format === 'png' ? 'image/png' : 'image/jpeg',
    fileSize: optimizedOriginal.length,
    width,
    height,
    orientation: deriveOrientation(width, height),
    dominantColors,
    durationSeconds: null,
    variants,
  };
}
