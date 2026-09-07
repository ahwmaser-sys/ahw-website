#!/usr/bin/env node
// Checks every image path stored in the database against the files that
// actually exist under public/, and optionally repairs the ones that are
// merely pointing at the wrong file EXTENSION.
//
// WHY THIS EXISTS
// Portfolio images were migrated into the database as plain paths
// (PortfolioProjectImage.externalUrl and the four singular slots on
// PortfolioProject). Nothing keeps those strings in step with the files on
// disk afterwards, so replacing a photo with a different format silently
// leaves the row pointing at a path that no longer exists. Found in practice:
// two tmreya-kout-mall records referencing `.jpg` while only `.webp` is on
// disk -- commit 39ac897 changed the files and the rows were never
// re-migrated.
//
// A dangling reference used to mean a 404 from Vercel's optimizer. It still
// does now that images are pre-generated, because scripts/generate-image-variants.mjs
// can only build variants for files that exist. Either way the visitor sees
// alt text instead of a photo, so it is worth catching deliberately rather
// than noticing on a page.
//
// SAFETY
//   - read-only by default; prints a report and changes nothing
//   - `--fix` only rewrites a path when the SAME basename exists under a
//     different image extension in the SAME directory. It never invents a
//     path, never picks between two candidates, and never clears a value.
//   - `--fix` requires CONFIRM_TARGET to appear in the database host, the
//     same guard scripts/create-staging-admin.mjs uses.
//
// USAGE
//   DATABASE_URL='postgres://...' node scripts/audit-image-references.mjs
//   DATABASE_URL='postgres://...' CONFIRM_TARGET='<host fragment>' \
//     node scripts/audit-image-references.mjs --fix

import { access, readdir } from 'node:fs/promises';
import { dirname, join, basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(here, '..', 'public');

const FIX = process.argv.includes('--fix');
const { DATABASE_URL, CONFIRM_TARGET } = process.env;

if (!DATABASE_URL) {
  console.error('\n✗ DATABASE_URL is required.\n');
  process.exit(1);
}

let host = '';
try {
  host = new URL(DATABASE_URL).host;
} catch {
  console.error('\n✗ DATABASE_URL is not a valid URL.\n');
  process.exit(1);
}

if (FIX) {
  if (!CONFIRM_TARGET) {
    console.error(
      '\n✗ --fix requires CONFIRM_TARGET, set to a distinctive substring of the database host\n' +
        '  you intend to write to. This is the guard against repairing the wrong database.\n'
    );
    process.exit(1);
  }
  if (!host.includes(CONFIRM_TARGET)) {
    console.error(
      `\n✗ Refusing to write.\n    database host : ${host}\n    CONFIRM_TARGET: ${CONFIRM_TARGET}\n`
    );
    process.exit(1);
  }
}

// table, primary key, and the columns holding an image path
const TARGETS = [
  ['PortfolioProject', 'id', ['heroImageUrl', 'hubFlagshipImageUrl', 'hubPairImageUrl', 'ogImageUrl']],
  ['PortfolioProjectImage', 'id', ['externalUrl']],
  ['Publication', 'id', ['coverImageUrl']],
];

const IMAGE_EXT = ['.webp', '.jpg', '.jpeg', '.png', '.avif'];
const exists = (p) => access(p).then(() => true, () => false);

/** Same basename, different image extension, same directory. */
async function findReplacement(relPath) {
  const abs = join(PUBLIC_DIR, decodeURIComponent(relPath).replace(/^\//, ''));
  const dir = dirname(abs);
  const stem = basename(abs, extname(abs));
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return null; // whole directory is gone -- not an extension problem
  }
  const hits = entries.filter(
    (e) => basename(e, extname(e)) === stem && IMAGE_EXT.includes(extname(e).toLowerCase())
  );
  // Exactly one candidate, or this is ambiguous and a human should look.
  if (hits.length !== 1) return null;
  return `${dirname(relPath)}/${hits[0]}`;
}

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log(`connected to ${host}${FIX ? '  (--fix ENABLED)' : '  (read-only)'}\n`);

let checked = 0;
let ok = 0;
const broken = [];
const repairable = [];

for (const [table, pk, columns] of TARGETS) {
  const cols = columns.map((c) => `"${c}"`).join(', ');
  let rows;
  try {
    ({ rows } = await client.query(`SELECT "${pk}", ${cols} FROM "${table}"`));
  } catch (error) {
    console.error(`  ! skipping ${table}: ${error.message}`);
    continue;
  }
  for (const row of rows) {
    for (const col of columns) {
      const value = row[col];
      // Only local public/ paths are checkable. Blob/CDN URLs and
      // /api/media/<id> references are resolved elsewhere at runtime.
      if (!value || typeof value !== 'string') continue;
      if (!value.startsWith('/') || value.startsWith('/api/')) continue;
      checked += 1;
      const abs = join(PUBLIC_DIR, decodeURIComponent(value).replace(/^\//, ''));
      if (await exists(abs)) {
        ok += 1;
        continue;
      }
      const replacement = await findReplacement(value);
      const entry = { table, pk: row[pk], col, value, replacement };
      broken.push(entry);
      if (replacement) repairable.push(entry);
    }
  }
}

console.log(`  checked   : ${checked} local image references`);
console.log(`  resolve   : ${ok}`);
console.log(`  DANGLING  : ${broken.length}\n`);

for (const b of broken) {
  console.log(`  ✗ ${b.table}.${b.col} (${b.pk})`);
  console.log(`      is : ${b.value}`);
  console.log(`      ${b.replacement ? `fix: ${b.replacement}` : 'no same-name file in that folder — needs a human'}`);
}

if (broken.length && !FIX) {
  console.log(
    `\n  ${repairable.length} of ${broken.length} are a plain extension mismatch and can be repaired:` +
      `\n    CONFIRM_TARGET='<host fragment>' node scripts/audit-image-references.mjs --fix\n`
  );
}

if (FIX && repairable.length) {
  console.log(`\n  repairing ${repairable.length}...`);
  for (const r of repairable) {
    await client.query(`UPDATE "${r.table}" SET "${r.col}" = $1 WHERE "id" = $2`, [r.replacement, r.pk]);
    console.log(`    ✓ ${r.table}.${r.col} (${r.pk}) -> ${basename(r.replacement)}`);
  }
  console.log('  done.');
}

await client.end();
if (broken.length && !FIX) process.exitCode = 1;
