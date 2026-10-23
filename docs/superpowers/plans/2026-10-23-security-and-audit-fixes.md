# ahwspaces.com Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 32 production dependency vulnerabilities on ahwspaces.com — four of them unauthenticated remote code execution in Next.js itself — without changing any behaviour the audit found to be already correct.

**Architecture:** One branch, one task per upgrade group, each gated by a test that fails before the upgrade and passes after. The audit found the application code sound: the fixes are version bumps plus the regression tests that prove the bump broke nothing. Nothing is deployed; the branch is handed over for review.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Prisma 7 + Postgres (Neon), pnpm workspaces, Vitest, Vercel.

**Spec:** This document. The audit that produced it is summarised below under *Findings*, because there is no separate spec — the user asked for an audit and its fixes in one pass.

## Global Constraints

- **No production deploy.** Do not push to `main`. All work on `audit/security-fixes-2026-10`.
- **No DNS changes.** Cloudflare steps are written for the user to run, not executed.
- **No deletions** without explicit approval.
- **Next.js floor: `>=16.4.1`** — the highest patched version across the four critical advisories. Target `16.4.2` (latest 16.x).
- **The local machine has no Postgres**, so `next build` cannot run here; it needs the database to collect page data. Every task's gate is therefore `tsc` + `eslint` + `vitest`, and the real build gate is Vercel's preview deployment of the branch.
- Existing behaviour verified correct during the audit must not change: security headers, `inert` usage, rate limiting, honeypot, image loader output.

## Findings

Ordered by severity. Everything not listed here was measured and found correct.

### Critical

| # | Finding | Evidence |
|---|---|---|
| C1 | **Next.js 16.2.12 carries 4 unauthenticated RCE advisories**, plus an image-route SSRF and an App Router DoS | `pnpm audit --prod`: GHSA advisories patched in 16.3.3, 16.3.6, 16.4.1 |
| C2 | **28 further production advisories** in transitive deps: `sharp` (libheif, librsvg), `undici` DoS, `markdown-it` quadratic rendering, `mysql2` auth-plugin downgrade, `fast-uri` SSRF/authority injection, `nanoid`, `source-map-js`, `deepmerge-ts`, `@tiptap/core` prototype key | `pnpm audit --prod`: 3 low / 7 moderate / 17 high / 5 critical |

### Needs a decision from the user

| # | Finding |
|---|---|
| D1 | **Cloudflare is not in front of the site.** Nameservers are `dns1/dns2.registrar-servers.com` (Namecheap); responses come straight from Vercel (`server: Vercel`, no `cf-ray`). Steps are documented, not executed. |

### Verified correct — do not "fix"

Recorded so a future reader does not redo this work.

- **Security headers are already strong**: full CSP (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`), HSTS `max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/mic/geolocation/topics.
- **Secrets hygiene**: no key material in tracked files, no `.env` tracked, `.gitignore` covers `.env*` with an `.example` exception, and the only two `NEXT_PUBLIC_` variables are a GA measurement ID and the site URL — both public by design.
- **Form protection**: Postgres-backed rate limiting on `/api/contact` and `/api/portal/auth/login`, plus a honeypot that returns success to bots rather than revealing the check.
- **Accessibility**: axe-core clean across 10 pages except 3 contrast notes on `aria-hidden` decorative numerals. The floating nav panel sets `inert`, so its 42 links are genuinely outside the tab order — 60 Tab presses landed on none of them.
- **Responsive**: zero horizontal overflow at 390 / 820 / 1440 px on `/`, `/projects`, `/contact`.
- **Links**: 84 internal + 16 external, zero broken (Facebook's 400s are bot detection; a real browser gets 200).
- **RTL**: not applicable — the site is `lang="en"` with no Arabic routes. Arabic is a separate, larger decision already raised with the user.
- **SEO/CWV**: fixed earlier this session (share images on 11 pages, capability statement in sitemap, robots media allowance, office geo + opening hours). CLS 0.003 site-wide. The `srcset` space-encoding fix is deployed and confirmed: `/projects` now fetches the 1200px variant where it previously always fetched 2048px.

## Review Focus

Inputs these upgrades could break that no task's own test would otherwise catch.

1. **`sharp` major-minor bump and the image pipeline** — admin uploads resize through `sharp`; a changed default (e.g. `withoutEnlargement`, EXIF rotation) would silently alter generated variants. Covered by a byte-identity test in Task 2.
2. **Next 16.4 and the custom image loader** — `images.loader`/`loaderFile` is the single line standing between this site and billed image optimization. Covered in Task 1 by re-running `verify-no-vercel-image-optimization` against built output, and by the loader's own unit tests.
3. **Next 16.4 and `generateMetadata`** — the share images restored this week come from per-page `openGraph`; a metadata-merge behaviour change would drop them again. Covered in Task 1 by asserting `ogImages()` output shape and a rendered-metadata check on the preview URL.
4. **Prisma 7 + Next 16.4 server actions** — the contact route re-validates with the shared zod schema and writes via Prisma; a runtime change there fails closed (no enquiries) and silently. Covered in Task 1 by the contact schema tests plus an explicit preview-deployment POST.
5. **`markdown-it` / `@tiptap/core` bump and stored admin content** — news and publication bodies are authored in Tiptap and rendered through markdown-it; a parser change could alter existing published articles. Covered in Task 3 by rendering a fixture of real stored content and asserting the HTML is unchanged.

---

## Task 1: Next.js to >=16.4.1

Closes the four unauthenticated RCE advisories, the `next/og` RCE, the image SSRF, and the App Router DoS.

**Files:**
- Modify: `apps/public-site/package.json` (the `next` dependency, currently `^16.2.12`)
- Modify: `pnpm-lock.yaml` (regenerated)
- Test: `apps/public-site/src/lib/security/dependency-floor.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: a resolved `next` version at or above `16.4.1`, which Tasks 2 and 3 assume is already in the lockfile.

- [ ] **Step 1: Write the failing test**

```ts
// apps/public-site/src/lib/security/dependency-floor.test.ts
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Next 16.2.12 shipped four advisories titled "Unauthenticated Remote Code
 * Execution" (patched in 16.3.3 and 16.3.6), an image-route SSRF (16.3.8),
 * and an App Router denial of service (16.4.1). 16.4.1 is the highest of
 * those floors, so it is the floor here.
 *
 * This asserts the RESOLVED version, not the package.json range: a caret
 * range can satisfy the floor on paper while the lockfile pins something
 * older, and the lockfile is what ships.
 */
const FLOOR = [16, 4, 1];

function resolvedVersion(pkg: string): number[] {
  const { version } = require(`${pkg}/package.json`) as { version: string };
  return version.split('.').slice(0, 3).map(Number);
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
    expect(atLeast(resolvedVersion('next'), FLOOR)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd apps/public-site && pnpm exec vitest run src/lib/security/dependency-floor.test.ts`
Expected: FAIL — resolved version is 16.2.12.

- [ ] **Step 3: Raise the floor**

In `apps/public-site/package.json` set `next` to `^16.4.2`, then from the repo root run `pnpm install` to regenerate the lockfile. `@vercel/speed-insights` depends on `next` too; let pnpm dedupe rather than pinning it by hand.

- [ ] **Step 4: Run the test and the full suite**

Run: `cd apps/public-site && pnpm exec vitest run && pnpm exec tsc --noEmit && pnpm exec eslint src/`
Expected: dependency-floor PASSES; all other test files still pass; tsc 0 errors; eslint 0 errors.

- [ ] **Step 5: Confirm the advisories are gone**

Run: `pnpm audit --prod 2>&1 | grep -c "Package.*next"`
Expected: `0`. If `pnpm audit --prod` still reports `next`, read the advisory — a newly published one is a finding, not a failed upgrade.

- [ ] **Step 6: Commit**

```bash
git add apps/public-site/package.json pnpm-lock.yaml apps/public-site/src/lib/security/dependency-floor.test.ts
git commit -m "Upgrade Next.js past the unauthenticated RCE advisories"
```

---

## Task 2: sharp, and proving the image pipeline is unchanged

`sharp` carries two high advisories (libheif `GHSA-g89c-p67h-r4..`, librsvg), patched at `>=0.35.5`. It is the engine behind both the build-time variant generator and admin uploads, so the upgrade needs evidence it produces the same bytes.

**Files:**
- Modify: `apps/public-site/package.json` (the `sharp` dependency)
- Modify: `apps/public-site/src/lib/security/dependency-floor.test.ts` (add the `sharp` floor)
- Test: `apps/public-site/scripts/generate-image-variants.identity.test.ts` (create)

**Interfaces:**
- Consumes: `atLeast()` and `resolvedVersion()` from Task 1's test file.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write the failing floor assertion**

Add to `dependency-floor.test.ts`:

```ts
  it('runs a sharp without the libheif and librsvg advisories', () => {
    expect(atLeast(resolvedVersion('sharp'), [0, 35, 5])).toBe(true);
  });
```

- [ ] **Step 2: Write the byte-identity test**

```ts
// apps/public-site/scripts/generate-image-variants.identity.test.ts
import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

/**
 * The variant generator's whole contract is that a width-only resize keeps
 * the source aspect ratio and never enlarges. A sharp upgrade that changed
 * a default here would quietly re-encode 5,800 files on the next build and
 * nobody would see it until a photo looked wrong.
 *
 * Encodes one real project photo at one width with the generator's exact
 * settings and asserts the dimensions, not a golden hash: AVIF output is
 * allowed to differ between libavif builds, the geometry is not.
 */
describe('image variant geometry', () => {
  it('scales to the requested width and derives the height', async () => {
    const dir = join(__dirname, '..', 'public', 'images');
    const file = (await readdir(dir)).find((f) => /\.(jpe?g|png)$/i.test(f));
    expect(file, 'needs at least one source image under public/images').toBeTruthy();

    const input = await readFile(join(dir, file!));
    const source = await sharp(input).metadata();
    const out = await sharp(input)
      .rotate()
      .resize({ width: 640, withoutEnlargement: true, fit: 'inside' })
      .avif({ quality: 72, effort: 2 })
      .toBuffer();
    const result = await sharp(out).metadata();

    const expectedWidth = Math.min(640, source.width!);
    expect(result.width).toBe(expectedWidth);
    expect(result.height).toBe(Math.round((source.height! * expectedWidth) / source.width!));
  });
});
```

- [ ] **Step 3: Run both and confirm the floor fails**

Run: `cd apps/public-site && pnpm exec vitest run src/lib/security/dependency-floor.test.ts scripts/generate-image-variants.identity.test.ts`
Expected: the sharp floor FAILS; the geometry test PASSES (it describes current behaviour, which is the point — it is the before-and-after witness).

- [ ] **Step 4: Raise the floor**

Set `sharp` to `^0.35.5` in `apps/public-site/package.json`; `pnpm install` from the repo root.

- [ ] **Step 5: Run both again**

Run: `cd apps/public-site && pnpm exec vitest run`
Expected: both PASS. A geometry failure here means sharp changed a resize default and the generator needs adjusting before going further.

- [ ] **Step 6: Commit**

```bash
git add apps/public-site/package.json pnpm-lock.yaml apps/public-site/src/lib/security/dependency-floor.test.ts apps/public-site/scripts/generate-image-variants.identity.test.ts
git commit -m "Upgrade sharp past the libheif and librsvg advisories"
```

---

## Task 3: The remaining transitive advisories

`undici`, `markdown-it`, `mysql2`, `fast-uri`, `nanoid`, `source-map-js`, `deepmerge-ts`, `@tiptap/core`. Most are reached through a parent package rather than declared directly, so the lever is `pnpm.overrides` in the root `package.json`, not a dependency bump.

**Files:**
- Modify: `package.json` (repo root — add a `pnpm.overrides` block)
- Modify: `pnpm-lock.yaml`
- Modify: `apps/public-site/src/lib/security/dependency-floor.test.ts`
- Test: `apps/public-site/src/lib/content/markdown-render.test.ts` (create)

**Interfaces:**
- Consumes: `atLeast()` / `resolvedVersion()` from Task 1.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write the failing floor assertions**

Add one `it()` per package to `dependency-floor.test.ts`, with these floors:

| package | floor |
|---|---|
| `undici` | `6.28.1` |
| `markdown-it` | `14.3.3` |
| `mysql2` | `3.23.1` |
| `fast-uri` | `3.1.7` |
| `nanoid` | `3.3.18` |
| `source-map-js` | `1.2.2` |
| `deepmerge-ts` | `8.0.0` |
| `@tiptap/core` | `3.30.4` |

A package that is not installed at all should be skipped rather than failed — wrap `resolvedVersion` in a try/catch and `it.skipIf` on absence, so the suite does not break when a parent drops a dependency.

- [ ] **Step 2: Write the stored-content regression test**

```ts
// apps/public-site/src/lib/content/markdown-render.test.ts
import { describe, it, expect } from 'vitest';

/**
 * News and publication bodies are authored in Tiptap and rendered through
 * markdown-it. Both are being upgraded for advisories, and a parser change
 * would alter articles that are already published -- silently, because
 * nothing re-renders them until someone opens the page.
 *
 * Pins the constructs this site's own content actually uses. Extend it with
 * a real excerpt whenever an article starts using something new.
 */
const FIXTURE = [
  '# Heading',
  '',
  'A paragraph with **bold**, *italic*, and a [link](https://ahwspaces.com).',
  '',
  '- first',
  '- second',
  '',
  '> A quotation.',
  '',
  "Smart quotes and an em dash -- they're part of the house style.",
].join('\n');

describe('markdown rendering of stored article content', () => {
  it('renders the constructs the site uses without change', async () => {
    const MarkdownIt = (await import('markdown-it')).default;
    const html = new MarkdownIt({ typographer: true }).render(FIXTURE);

    expect(html).toContain('<h1>Heading</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('href="https://ahwspaces.com"');
    expect(html).toContain('<li>first</li>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('—');       // typographer turns -- into an em dash
    expect(html).toContain('’');       // and the apostrophe into a curly one
  });
});
```

- [ ] **Step 3: Run and confirm the floors fail**

Run: `cd apps/public-site && pnpm exec vitest run src/lib/security/dependency-floor.test.ts src/lib/content/markdown-render.test.ts`
Expected: the new floor assertions FAIL; the markdown test PASSES against the current version.

- [ ] **Step 4: Add the overrides**

Add to the root `package.json`:

```json
"pnpm": {
  "overrides": {
    "undici": ">=6.28.1",
    "markdown-it": ">=14.3.3",
    "mysql2": ">=3.23.1",
    "fast-uri": ">=3.1.7",
    "nanoid": ">=3.3.18",
    "source-map-js": ">=1.2.2",
    "deepmerge-ts": ">=8.0.0",
    "@tiptap/core": ">=3.30.4"
  }
}
```

Then `pnpm install` from the repo root. If an override is incompatible with its parent, pnpm says so at install time — drop that one entry, note the parent that blocks it, and carry it into the final report as an accepted risk rather than forcing it.

- [ ] **Step 5: Run everything**

Run: `cd apps/public-site && pnpm exec vitest run && pnpm exec tsc --noEmit && pnpm exec eslint src/`
Expected: all PASS.

- [ ] **Step 6: Re-audit**

Run: `pnpm audit --prod`
Expected: 0 critical, 0 high. Record whatever remains, with the parent that pins it.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml apps/public-site/src/lib/security/dependency-floor.test.ts apps/public-site/src/lib/content/markdown-render.test.ts
git commit -m "Override transitive dependencies past their advisories"
```

---

## Task 4: Prove the upgrades on a Vercel preview

`next build` cannot run on this machine — there is no Postgres for page-data collection — so the branch itself is the build gate. A preview deployment is not a production deploy: it gets its own URL and `main` is untouched.

**Files:** none. This task produces evidence.

**Interfaces:**
- Consumes: the branch from Tasks 1–3.
- Produces: a preview URL for the report.

- [ ] **Step 1: Push the branch**

```bash
git push -u origin audit/security-fixes-2026-10
```

- [ ] **Step 2: Wait for the preview and confirm it built**

Vercel builds a preview per branch. Confirm `state: READY` and that the build log ends with `verify-no-vercel-image-optimization: … zero /_next/image references` — the guard that keeps image optimization billing switched off.

- [ ] **Step 3: Check the five Review Focus risks against the preview**

On the preview URL, confirm: `/projects` still serves a pre-generated `/_img/…avif` (loader intact); `/projects` and `/contact` still carry `og:image` with their own alt (metadata merge intact); and a minimal POST to `/api/contact` returns 200 (Prisma + zod path intact).

> The POST writes a real enquiry row to the production database, because preview deployments share it. Use a name that is obviously a test, and tell the user to delete it — as happened once already this session.

- [ ] **Step 4: Record the results in the final report. No merge, no production deploy.**

---

## Task 5: Cloudflare — written steps only

D1 is a decision, not a defect. The site is healthy without Cloudflare; what it would add is a WAF, bot filtering, and rate limiting at the edge rather than in Postgres.

**Files:**
- Create: `docs/cloudflare-setup.md`

**Interfaces:** none.

- [ ] **Step 1: Write the runbook**

Record, in order: adding the site to Cloudflare and letting it import existing DNS; **verifying the imported records against the current live set before changing anything** (`A ahwspaces.com 216.198.79.1`, `CNAME www → e6245ee42b13a3d1.vercel-dns-017.com`, plus every MX and TXT — an import that misses a mail record takes email down); changing nameservers at Namecheap from `dns1/dns2.registrar-servers.com`; then, only after propagation, SSL/TLS **Full (strict)**, Always Use HTTPS, HSTS, WAF Managed Rules, Bot Fight Mode, rate limiting on `/admin/login` and `/api/contact`, Turnstile on the contact form, and cache rules.

Two things the runbook must say plainly:

- **The security headers already exist** and are served by the app. Cloudflare's "Security Headers" feature would duplicate them; configure Cloudflare to leave them alone rather than adding a second, drifting source.
- **Turnstile needs application code** — a widget in `ContactForm.tsx` and server-side verification in `/api/contact`. It is not a dashboard toggle, and it is a separate piece of work.

- [ ] **Step 2: Commit**

```bash
git add docs/cloudflare-setup.md
git commit -m "Document the Cloudflare setup steps, for the user to run"
```

- [ ] **Step 3: Stop. Do not touch DNS.**

---

## Not doing, and why

- **Upgrading Prisma to 8** — `pnpm audit` does not flag it; 8.x is release-candidate. Churn without a security reason.
- **Dev-only advisories** (`vitest`, `vite`, `esbuild`) — 21 of the 53 total. They do not ship. Worth a later cleanup, not a security fix.
- **Reducing hero image resolution** — the `/projects` weight turned out to be the broken `srcset`, now fixed and verified. No quality trade-off needed.
- **Any SEO, accessibility, or responsive change** — measured this session and found correct. See *Verified correct*.
