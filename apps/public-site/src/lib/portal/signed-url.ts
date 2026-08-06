import { createHmac, timingSafeEqual } from 'crypto';

// Short-lived signed download links, per the brief's explicit
// "authenticated endpoints with short-lived signed URLs, never permanent
// direct file paths" requirement. Authorization is checked once, at
// issuance (requireProjectAccess in the caller) — the token itself is
// the proof of that check, valid only for a few minutes, so the download
// route doesn't need a live session to honor it (same model as an S3
// presigned URL). Scoped by kind ('doc' | 'photo') so a token minted for
// one asset table can never be replayed against the other.
//
// The secret is read lazily inside each function, not at module scope —
// Next.js imports route modules during `next build`'s page-data-
// collection pass, and a module-level throw over a missing env var fails
// the whole build the instant this file is imported, over a secret only
// actually needed once a token is really being signed or verified. Same
// reasoning already applied to Resend (Contact/Careers routes) and
// INTEGRATION_ENCRYPTION_KEY (integrations/encryption.ts).
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET must be set to sign asset URLs.');
  }
  return secret;
}

type AssetKind = 'doc' | 'photo' | 'media' | 'variant' | 'graphic';

function signAssetToken(kind: AssetKind, assetId: string, expiresInSeconds: number): string {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const payload = `${kind}:${assetId}.${expiresAt}`;
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifyAssetToken(kind: AssetKind, token: string): string | null {
  const lastDot = token.lastIndexOf('.');
  const secondLastDot = token.lastIndexOf('.', lastDot - 1);
  if (lastDot < 0 || secondLastDot < 0) return null;

  const scopedId = token.slice(0, secondLastDot);
  const expiresAtRaw = token.slice(secondLastDot + 1, lastDot);
  const signature = token.slice(lastDot + 1);
  if (!scopedId.startsWith(`${kind}:`) || !expiresAtRaw || !signature) return null;

  const expectedSignature = createHmac('sha256', getSecret()).update(`${scopedId}.${expiresAtRaw}`).digest('hex');
  const provided = Buffer.from(signature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return scopedId.slice(kind.length + 1);
}

export function signDocumentToken(documentId: string, expiresInSeconds = 300): string {
  return signAssetToken('doc', documentId, expiresInSeconds);
}

export function verifyDocumentToken(token: string): string | null {
  return verifyAssetToken('doc', token);
}

export function signPhotoToken(photoId: string, expiresInSeconds = 300): string {
  return signAssetToken('photo', photoId, expiresInSeconds);
}

export function verifyPhotoToken(token: string): string | null {
  return verifyAssetToken('photo', token);
}

// Media Library originals — private, staff-only access (browsing/managing
// the DAM itself). Published variants attached to live content are served
// through a *separate*, unsigned public route
// (/api/media/[assetId]) that checks publish status instead of a token —
// see that route for why a signed token is the wrong model for content
// that's meant to be publicly visible.
export function signMediaToken(assetId: string, expiresInSeconds = 300): string {
  return signAssetToken('media', assetId, expiresInSeconds);
}

export function verifyMediaToken(token: string): string | null {
  return verifyAssetToken('media', token);
}

export function signVariantToken(variantId: string, expiresInSeconds = 300): string {
  return signAssetToken('variant', variantId, expiresInSeconds);
}

export function verifyVariantToken(token: string): string | null {
  return verifyAssetToken('variant', token);
}

export function signGraphicOutputToken(outputId: string, expiresInSeconds = 300): string {
  return signAssetToken('graphic', outputId, expiresInSeconds);
}

export function verifyGraphicOutputToken(token: string): string | null {
  return verifyAssetToken('graphic', token);
}
