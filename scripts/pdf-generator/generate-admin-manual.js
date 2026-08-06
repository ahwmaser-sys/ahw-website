const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    console.error('Usage: node generate-admin-manual.js <input.html> <output.pdf>');
    process.exit(1);
  }

  console.log('Starting Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  // Match the A4 @page size at 96 DPI — without this, Chromium's first
  // layout pass uses the default browser viewport (not the print page
  // size) to decide break points, which can desync from the second,
  // @page-constrained pass and produce duplicated/orphaned fragments.
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

  const fileUrl = 'file://' + path.resolve(inputPath);
  console.log(`Navigating to ${fileUrl}...`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

  console.log(`Generating PDF at ${outputPath}...`);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });

  console.log('PDF generated successfully!');
  await browser.close();
}

generatePDF().catch((err) => {
  console.error(err);
  process.exit(1);
});
