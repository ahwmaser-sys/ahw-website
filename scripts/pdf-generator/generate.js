const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  console.log('Starting Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new'
  });
  
  const page = await browser.newPage();
  
  // Set viewport to A4 dimensions (at 96 DPI)
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
  
  const port = process.env.PDF_SOURCE_PORT || '3005';
  const url = `http://localhost:${port}/capability-statement/print`;
  console.log(`Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  } catch (error) {
    console.error(`Failed to load page. Is the Next.js server running on port ${port}?`);
    console.error(error);
    await browser.close();
    process.exit(1);
  }

  // Ensure all images are loaded
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
  });

  const outputPath = path.join(__dirname, '..', '..', 'apps', 'public-site', 'public', 'documents', 'ahw-capability-statement.pdf');
  console.log(`Generating PDF at ${outputPath}...`);
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true, // Use CSS @page rules
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });
  
  console.log('PDF generated successfully!');
  await browser.close();
}

generatePDF().catch(console.error);
