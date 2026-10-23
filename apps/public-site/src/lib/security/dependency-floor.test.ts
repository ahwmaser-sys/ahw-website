import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

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
  try {
    const { version } = require(`${pkg}/package.json`) as { version: string };
    return version.split('.').slice(0, 3).map((n) => parseInt(n, 10) || 0);
  } catch {
    return null; // not installed — a parent dropped it
  }
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
});
