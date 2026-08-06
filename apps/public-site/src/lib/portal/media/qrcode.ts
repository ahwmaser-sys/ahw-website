import QRCode from 'qrcode';
import sharp from 'sharp';
import { readFileByKey } from '../storage';
import type { BrandQrStyle } from '../brand-kit';

const DEFAULT_STYLE: BrandQrStyle = { foreground: '#0F1115', background: '#F2F4F7', logoOverlay: false };

// Generates a branded QR code PNG for a URL — Brand Kit's foreground/
// background colors and optional center logo overlay, not a generic
// black-on-white code. Used by Campaigns (Section: campaign landing-page
// links) and available standalone from the Brand Kit page for testing.
export async function generateQrCodeBuffer(
  content: string,
  style: BrandQrStyle = DEFAULT_STYLE,
  logoStorageKey?: string | null
): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(content, {
    type: 'png',
    width: 800,
    margin: 2,
    color: { dark: style.foreground, light: style.background },
    errorCorrectionLevel: style.logoOverlay ? 'H' : 'M', // higher error correction leaves room for a center logo without breaking scannability
  });

  if (!style.logoOverlay || !logoStorageKey) {
    return qrBuffer;
  }

  const logoBuffer = await readFileByKey(logoStorageKey);
  const logoSize = 160;
  const resizedLogo = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  return sharp(qrBuffer)
    .composite([{ input: resizedLogo, gravity: 'center' }])
    .png()
    .toBuffer();
}
