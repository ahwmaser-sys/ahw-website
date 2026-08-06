const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../branding/AHW MASR _ logo final.png');
const publicDir = path.join(__dirname, '../apps/public-site/public');
const imagesDir = path.join(publicDir, 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function processLogo() {
  try {
    const image = sharp(sourceFile);
    const metadata = await image.metadata();

    // 1. Original format (optimized webp) - default "light" background version (assuming logo is dark)
    await image
      .webp({ quality: 90 })
      .toFile(path.join(imagesDir, 'logo-dark.webp'));

    // 2. White version (invert lightness for dark backgrounds)
    // To make a logo white, we can extract the alpha channel and create a solid white image using it as a mask
    // If the logo has colors, this makes a silhouette. It's often required for minimalist dark themes.
    const alpha = await image.extractChannel('alpha').toBuffer();
    await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .joinChannel(alpha)
    .webp({ quality: 90 })
    .toFile(path.join(imagesDir, 'logo-white.webp'));

    // 3. Favicon (32x32)
    // We'll just resize the logo. For a true favicon, a cropped icon is better, but without manual crop, we fit it.
    await image
      .resize({ width: 32, height: 32, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon.ico')); // using PNG format but named .ico for basic support, Next.js supports favicon.png too
    await image
      .resize({ width: 32, height: 32, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));

    // 4. Apple Touch Icon (180x180) - usually solid background
    await image
      .resize({ width: 180, height: 180, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // 5. Open Graph Image (1200x630)
    // Placing the white logo centered on a dark premium background (#14171a)
    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 20, g: 23, b: 26, alpha: 1 }
      }
    })
    .composite([
      {
        input: await sharp(path.join(imagesDir, 'logo-white.webp')).resize({ width: 600, fit: 'inside' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, 'og-image.jpg'));

    console.log('Logo processing complete.');
  } catch (err) {
    console.error('Error processing logo:', err);
  }
}

processLogo();
