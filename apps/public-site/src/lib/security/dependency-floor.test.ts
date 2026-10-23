import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

/**
 * Minimum versions that carry the fix for a published advisory.
 *
 * These assert the RESOLVED version, not the range in package.json: a caret
 * range can satisfy a floor on paper while the lockfile pins something older,
 * and the lockfile is what ships. The test exists so an upgrade cannot be
 * quietly undone by a later `pnpm install` that re-resolves downwards.
 */
function resolvedVersion(pkg: string): number[] | null {
  // Two lookups on purpose. Many packages (sharp among them) restrict their
  // `exports` map and refuse `require('<pkg>/package.json')`, so when that
  // throws we resolve the package's entry point instead and walk up to the
  // nearest package.json that actually belongs to it. Without the fallback
  // this helper reports "not installed" for a package that plainly is, and
  // the floor silently stops being checked.
  let version: string | undefined;
  try {
    ({ version } = require(`${pkg}/package.json`) as { version: string });
  } catch {
    try {
      let dir = dirname(require.resolve(pkg));
      for (let up = 0; up < 8 && dir !== dirname(dir); up += 1) {
        const candidate = join(dir, 'package.json');
        if (existsSync(candidate)) {
          const parsed = JSON.parse(readFileSync(candidate, 'utf8')) as { name?: string; version?: string };
          if (parsed.name === pkg && parsed.version) {
            version = parsed.version;
            break;
          }
        }
        dir = dirname(dir);
      }
    } catch {
      return null;
    }
  }
  if (!version) return null;
  return version.split('.').slice(0, 3).map((n) => parseInt(n, 10) || 0);
}

function atLeast(actual: number[], floor: number[]): boolean {
  for (let i = 0; i < floor.length; i += 1) {
    const a = actual[i] ?? 0;
    const f = floor[i] ?? 0;
    if (a !== f) return a > f;
  }
  return true;
}

describe('dependency security floors', () => {
  it('runs a Next.js without the unauthenticated RCE advisories', () => {
    // 16.2.12 shipped four advisories titled "Unauthenticated Remote Code
    // Execution" (patched 16.3.3 / 16.3.6), an image-route SSRF (16.3.8) and
    // an App Router denial of service (16.4.1). 16.4.1 is the highest floor.
    const v = resolvedVersion('next');
    expect(v, 'next must be installed').not.toBeNull();
    expect(atLeast(v!, [16, 4, 1]), `resolved next@${v!.join('.')}`).toBe(true);
  });

  it('runs a sharp without the libheif and librsvg advisories', () => {
    // Two high advisories reached through sharp's bundled image codecs:
    // libheif (GHSA-g89c-p67h-r4..) and librsvg. Patched at 0.35.5.
    const v = resolvedVersion('sharp');
    expect(v, 'sharp must be installed').not.toBeNull();
    expect(atLeast(v!, [0, 35, 5]), `resolved sharp@${v!.join('.')}`).toBe(true);
  });
});
