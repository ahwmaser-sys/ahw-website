import { fileTypeFromBuffer } from 'file-type';

export type MediaAssetKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'ICON' | 'LOGO';

const ALLOWED_MIMES: Record<MediaAssetKind, ReadonlySet<string>> = {
  IMAGE: new Set(['image/jpeg', 'image/png', 'image/webp']),
  LOGO: new Set(['image/png', 'image/svg+xml', 'image/webp']),
  ICON: new Set(['image/png', 'image/svg+xml']),
  VIDEO: new Set(['video/mp4', 'video/quicktime', 'video/webm']),
  DOCUMENT: new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]),
};

const MAX_BYTES: Record<MediaAssetKind, number> = {
  IMAGE: 25 * 1024 * 1024,
  LOGO: 10 * 1024 * 1024,
  ICON: 5 * 1024 * 1024,
  VIDEO: 500 * 1024 * 1024,
  DOCUMENT: 25 * 1024 * 1024,
};

export interface ValidationResult {
  ok: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
}

// Real content-sniffed types only — file-type reads magic bytes, never
// trusts the browser-supplied extension or declared Content-Type. SVG is
// the one deliberate exception: it's XML text, not sniffable by magic
// bytes, so LOGO/ICON kinds fall back to the declared type only when it's
// exactly "image/svg+xml" and the buffer parses as well-formed-looking XML
// (a cheap `<svg` substring check) — SVG can carry embedded <script>, so
// this is intentionally narrow, not a general "trust the declared type"
// escape hatch.
export async function validateMediaFile(buffer: Buffer, kind: MediaAssetKind, declaredType: string, fileSize: number): Promise<ValidationResult> {
  const maxBytes = MAX_BYTES[kind];
  if (fileSize > maxBytes) {
    return { ok: false, error: `File exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB limit for ${kind.toLowerCase()} assets.` };
  }

  const allowed = ALLOWED_MIMES[kind];

  if (declaredType === 'image/svg+xml' && (kind === 'LOGO' || kind === 'ICON')) {
    const head = buffer.subarray(0, 512).toString('utf-8').trimStart();
    if (!head.startsWith('<?xml') && !head.startsWith('<svg')) {
      return { ok: false, error: 'File declared as SVG does not look like valid SVG.' };
    }
    return { ok: true, mimeType: 'image/svg+xml', extension: 'svg' };
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) {
    return { ok: false, error: 'Could not determine file type from content.' };
  }
  if (!allowed.has(detected.mime)) {
    return { ok: false, error: `File type "${detected.mime}" is not allowed for ${kind.toLowerCase()} assets.` };
  }

  return { ok: true, mimeType: detected.mime, extension: detected.ext };
}
