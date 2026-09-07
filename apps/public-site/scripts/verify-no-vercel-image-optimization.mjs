#!/usr/bin/env node
// Fails the build if the site would send a single request to Vercel's Image
// Optimization endpoint.
//
// WHY THIS IS A BUILD STEP AND NOT A NOTE IN A README
// The image outage on this site was not caused by a bug; it was caused by the
// number of billable image transformations quietly growing until the monthly
// allowance ran out and Vercel started answering 402. The fix (a custom
// next/image loader pointing at pre-generated static AVIFs) is a single line
// of configuration. A future edit that removes `loader: 'custom'`, reverts
// next.config.js, or adds a component with `unoptimized={false}` and a remote
// loader would silently switch the meter back on, and nobody would notice
// until images started disappearing weeks later.
//
// So the guarantee is enforced where it cannot be forgotten: this scans the
// actual built HTML for `/_next/image`, which is the exact string a browser
// would have to request for Vercel to bill anything. If it appears, the build
// stops.
//
// It checks OUTPUT, not configuration, on purpose -- config can be correct
// while a stray component still opts back in.

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const BUILT_HTML_DIR = join(appRoot, '.next', 'server', 'app');
const NEEDLE = '/_next/image';

if (!existsSync(BUILT_HTML_DIR)) {
  console.error(
    `\n✗ verify-no-vercel-image-optimization: no build output at ${relative(appRoot, BUILT_HTML_DIR)}.` +
      '\n  This must run AFTER `next build`.\n'
  );
  process.exit(1);
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const offenders = [];
let scanned = 0;

for await (const file of htmlFiles(BUILT_HTML_DIR)) {
  scanned += 1;
  const html = await readFile(file, 'utf8');
  if (!html.includes(NEEDLE)) continue;
  // Count occurrences so the message says how bad it is, not just that it happened.
  const count = html.split(NEEDLE).length - 1;
  offenders.push({ file: relative(BUILT_HTML_DIR, file), count });
}

if (offenders.length > 0) {
  const total = offenders.reduce((sum, o) => sum + o.count, 0);
  console.error(
    `\n✗ verify-no-vercel-image-optimization: found ${total} reference(s) to ${NEEDLE} ` +
      `across ${offenders.length} page(s).\n`
  );
  for (const o of offenders.slice(0, 15)) {
    console.error(`    ${o.count.toString().padStart(4)}x  ${o.file}`);
  }
  if (offenders.length > 15) console.error(`    ...and ${offenders.length - 15} more pages`);
  console.error(
    '\n  Every one of those is a billable Vercel Image Optimization transformation.' +
      '\n  Hobby includes 5,000/month and re-bills them roughly monthly; past the' +
      '\n  allowance Vercel returns 402 and visitors see alt text instead of photos.' +
      '\n  That already happened once on this site.' +
      '\n' +
      '\n  Most likely cause: `images.loader`/`loaderFile` was removed from' +
      '\n  next.config.js, or a component passes its own `loader` prop.' +
      '\n  See ../image-loader.js and scripts/generate-image-variants.mjs.\n'
  );
  process.exit(1);
}

console.log(
  `✓ verify-no-vercel-image-optimization: ${scanned} built page(s), zero ${NEEDLE} references. ` +
    'Vercel performs no image transformations for this deployment.'
);
