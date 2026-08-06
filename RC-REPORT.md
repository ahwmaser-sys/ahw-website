# AHW Architects — Release Candidate Report

## Stage 1 — Footer Variants

### Decisions Made

**[Stage 1]** Built all three variants reading exclusively from `packages/ui-components/src/data/offices.ts` (confirmed as the single source of truth — no other office/contact data file exists in the repo). No phone, address, or email is hardcoded in any component.

**[Stage 1]** `Next.js` App Router treats any folder prefixed with `_` as a "private folder" excluded from routing entirely — `/app/_design/...` would 404 unconditionally. Used the documented `%5F` URL-encoding escape (`app/%5Fdesign/`) so the route resolves at the literal `/_design/footer-variants` path requested, while the folder still reads as intentionally private/non-production in the source tree. Set `robots: { index: false, follow: false }` on the route's metadata as an extra safeguard.

**[Stage 1]** Extracted the WhatsApp/Instagram/Facebook/LinkedIn per-office popover logic (previously only living inside the current production `Footer.tsx`) into a shared `FooterSocialLinks` component, reused by all three variants. This avoided tripling ~180 lines of interactive state/click-outside-handling logic across three throwaway prototypes, while guaranteeing all three variants share the exact same (already-correct) social behavior rather than three hand-copied, divergence-prone versions.

**[Stage 1]** Within each variant, Egypt and Kuwait render through the exact same JSX/map path (`orderedOffices.map(...)`) — not two hand-written, independently-styled blocks. This makes visual parity a structural guarantee rather than something to eyeball: any styling difference between the two offices in a given variant would be a bug in the shared render path, not a per-office override.

**[Stage 1]** Added `lib/tel.ts` (`buildTelLink`), mirroring the existing `buildWhatsAppLink` helper's style, to produce clean `tel:` hrefs (digits and leading `+` only) per the brief's requirement. Used it in all three variants and also fixed the current production `Footer.tsx`'s inline, less-thorough version (`.replace(/\s+/g, '')` only stripped whitespace, not other formatting characters) to use the same helper — a small, low-risk consistency fix, not a redesign of that component.

**[Stage 1]** While regenerating `ui-components`' type declarations (needed for the new `buildTelLink` export to be visible to the app's typechecker), found `tsc -p packages/ui-components/tsconfig.json` — the package's *own* dedicated build — had never actually been run standalone this engagement; only `apps/public-site`'s typecheck had been verified. It caught a real, pre-existing gap in the current Footer.tsx (`headquarters` from `offices.find(...) || offices[0]` is typed as possibly `undefined` under `noUncheckedIndexedAccess`, and was used unguarded). Fixed with a non-null assertion (justified: `offices` is a static, non-empty array) and a guard around the first phone number. Logged here as a process note: future verification in this engagement should run both the app's and the package's own typecheck, not just the app's.

**[Stage 1]** Variant A originally used 4 distinct font-size tokens (xs/sm/lg/xl), exceeding the brief's 3-size cap. Fixed by making the oversized *logo image* (not text) carry the "large-scale anchor" role instead of an oversized description paragraph, and consolidating office names and body text to 2 text sizes plus the xs label size — 3 total, as required. Variant B had one arbitrary `0.65rem` value (not on the token scale) for the "HQ" tag; changed to `var(--font-size-xs)`.

**[Stage 1]** Variant C's closing statement uses `font-size: clamp(2rem, 6vw, var(--font-size-display))` — a single fluid declaration, counted as one type "size" in the type-system sense (one semantic role, responsive), not multiple discrete sizes.

### Blocked

**`TODO_CONTACT_UAE_OFFICE`** — The brief's Office Parity Rule and ordering instruction ("Egypt first, then Kuwait, then UAE") assume three offices exist. `packages/ui-components/src/data/offices.ts` contains only two: Egypt and Kuwait (labelled `"GCC Office"` as its public `displayName`, marked `isHeadquarters: true`). UAE is explicitly listed in that file's own trailing comment as a **future** office, with zero fields populated:

```ts
// Future offices:
// UAE
// Saudi Arabia
// Qatar
// China
```

Per the brief's own instruction ("NEVER invent, complete or infer a contact value... render `TODO_CONTACT_<FIELD>`"), no UAE office block was fabricated in any variant — there is no single missing field here, the entire office is absent from the source of truth. All three variants render the two real offices (Egypt, Kuwait) at equal parity; Egypt first, per the ordering rule, among the offices that actually exist.

**This blocks, or at minimum changes the shape of, several Stage 2 items that assume three offices**: `areaServed: Egypt, Kuwait, UAE, GCC` in structured data (UAE and GCC can be asserted as *served regions* independent of having a physical office — that's a defensible, separate claim from "we have a UAE office" — but this needs an explicit decision, not a silent assumption), the Office Parity Rule's three-way visual treatment, and any contact-page or project-enquiry surface that's expected to list a UAE office. Flagging now, before Stage 2 begins, rather than discovering it mid-flow.

**Recommendation**: either (a) add a real UAE office entry to `offices.ts` with actual address/phone/email before Stage 2 runs, or (b) explicitly confirm that Stage 2 should proceed with Egypt + Kuwait as the only *offices*, while still asserting UAE/GCC as served *markets* (not offices) in structured data and copy — a real, common, and honest distinction (a firm can serve a market without a local office). This needs your call before Stage 2's contact-page and structured-data work, since it changes what "office parity" concretely means throughout that stage.

### Measurements — Desktop (1440px), rendered

| Variant | Height | vs. current footer (349px) |
|---|---|---|
| A — Editorial | 651px | +302px |
| B — Compact Index | 401px | +52px |
| C — Statement Close | 619px | +270px |
| *(current production footer, for reference)* | 349px | — |

All three are taller than the current footer. This is expected and correct, not a regression: the current footer shows only one office's partial contact info (headquarters' email + first phone); every variant now shows **two complete office blocks** (full address, both phone numbers, email each) to satisfy the Office Parity Rule, which is new to this brief. B stays closest to the original footprint by design (its whole premise is density); A and C spend more vertical space deliberately, in service of their respective compositional goals.

### Verification

`tsc --noEmit` (app) — clean. `tsc -p packages/ui-components/tsconfig.json` (package) — clean, after the `headquarters` fix above. `next build` — 44 routes, clean, `/_design/footer-variants` confirmed present and static. `eslint .` — exit 0. Playwright: zero horizontal overflow at 320/768/1440px across all three variants; desktop/tablet/mobile screenshots captured for all three (referenced in the Stage 1 chat presentation).

---

## Stage 1, Round 2 — Blended Variants (D, E, F)

User feedback on round 1: preferred C most, B second; shared a reference screenshot (a
different product's footer) for its **organization and shape** — one wide row, brand block
on the left, tidy link columns on the right, single hairline divider, compact single-line
bottom bar; and asked for the Egypt office email to read `mwardany@ahwarchitects.com`.

### Decisions Made

**[Round 2]** The requested email is `offices.ts`'s existing `primaryEmail` field (Egypt:
`mwardany@ahwarchitects.com`, Kuwait: `wardany@ahwarchitects.com`), not a new value —
round 1 had used `generalEmail`, which is identical across both offices
(`info@ahwarchitects.com`) and is real data but the wrong field for this ask. Switched all
six variants (A-F) to `primaryEmail`. This also better satisfies the Office Parity Rule's
"each office block is complete and self-contained" — a shared email across offices reads
as less office-specific than distinct addresses do.

**[Round 2]** The reference screenshot's footer has no office/address content at all (a
generic SaaS Product/Resources/Company layout) — adapted its *shape* (wide brand column
left, narrow tidy columns right, one hairline rule, one compact bottom row) rather than
its *content structure*, since AHW's Office Parity Rule requirement (full Egypt + Kuwait
blocks) has no equivalent in the reference. Moved Social links into the left brand column
(next to the logo/description, matching the reference's icon-row placement) in D and F,
freeing the right-side columns to be Egypt / Kuwait / Company / Downloads only.

**[Round 2]** Built three variants, each a different blend ratio:
- **D — Row Editorial**: B's row structure + a restrained version of A's asymmetric
  weighting (wide brand column, narrower link columns). Text-link CTA ("Start Your
  Project →") instead of a bordered pill, matching the reference's minimal chrome.
- **E — Quiet Statement Row**: C's opening line kept, but turned down from an oversized
  anchor (previously `clamp(2rem, 6vw, 6rem)`) to a single confident tagline at
  `--font-size-2xl` (36px), sitting inline beside the logo rather than dominating its own
  huge row, directly above the same clean directory row as D.
- **F — Dense Row**: closest literal match to the reference's own proportions — hairline
  *vertical* rules between the four right-side columns (B's device), tightest vertical
  rhythm of the three.

### Measurements — Desktop (1440px)

| Variant | Height | vs. round 1 range (401-651px) |
|---|---|---|
| D — Row Editorial | 379px | shortest yet |
| E — Quiet Statement Row | 405px | ≈ B |
| F — Dense Row | 368px | shortest of all six |
| *(reference: current site footer)* | 349px | — |

All three read closer to B's density than to A/C's spend, while still carrying full
two-office parity content — confirms the blend: C's narrative quality (E) and B's
compactness (D, F) without either extreme's footprint.

### Verification

`tsc --noEmit`, `next build` (still 44 routes, clean), `eslint .` (exit 0) all re-run
clean. Playwright: zero horizontal overflow at 320/768/1440px across D, E, F.
Screenshots captured at desktop/tablet/mobile for all three.

---

## Stage 1 — Final Selection

**Selected: Variant C (Statement Close)**, with four refinements before wiring site-wide.

### Decisions Made

**[Final]** Added an explicit CTA button using Variant B's exact visual treatment (sharp
2px border-radius, 1px border, uppercase `--font-size-xs` label, hover-fills-solid) —
copied the CSS rule verbatim rather than approximating it, so it's a genuine borrowed
treatment, not a lookalike. Placed inline with the closing statement (`justify-content:
space-between` at desktop, stacked below it on mobile/tablet) so it reads as a direct,
actionable companion to the headline rather than a separate section. Nothing else in
Variant C's structure, spacing, or typography changed.

**[Final]** Kuwait's footer email changed from `primaryEmail` (`wardany@ahwarchitects.com`,
used in round 2) to `generalEmail` (`info@ahwarchitects.com`), per explicit instruction.
Egypt stays on `primaryEmail` (`mwardany@ahwarchitects.com`), per the original Stage 1
selection message. This is now an intentional, asymmetric, per-office business decision —
documented in code with a comment (`officeEmail()` in `Footer.tsx`) so a future reader
doesn't "fix" it back to a uniform field by mistake.

**[Final]** No UAE office block — confirmed again, still absent from `offices.ts`. Per
this message's explicit instruction, UAE is **not** to be fabricated as a physical office;
it may appear only as an `areaServed` region in structured data (Section 2 work) where
factually defensible (the practice can serve a market without a local office — a real,
common distinction). This resolves the Stage 1 blocker: Egypt + Kuwait are the only real
offices, both rendered at equal weight.

**[Final]** Wired site-wide: moved `FooterSocialLinks` (WhatsApp/Instagram/Facebook/
LinkedIn per-office popovers) from the throwaway design route into
`packages/ui-components/src/components/navigation/`, its proper home — used by the one
real `Footer.tsx` now, not by six parallel variants. Preserved the generic `socialLinks`
data-driven row (filtered to exclude Instagram/Facebook/LinkedIn, currently renders
nothing since all three current entries are excluded by that filter, but is real,
intentional, existing code providing extensibility for a future company-level platform
like X/Twitter) — this had been dropped when the six variants were first built in Stage 1;
restored here for full "100% of existing content preserved" fidelity in the final version.

**[Final]** Deleted `apps/public-site/src/app/%5Fdesign/` entirely (all six variant
components, the shared social-links duplicate, and the route itself) in one pass, then
cleared the stale `.next` build cache — Next's generated route-type-validator file
(`​.next/types/validator.ts`) still referenced the deleted route's module path and failed
`tsc --noEmit` until the cache was cleared. Not a real source error, a build-artifact
staleness issue; logged since it could look alarming without the explanation.

### Verification

`tsc --noEmit` (app) — clean. `tsc -p packages/ui-components/tsconfig.json` (package) —
clean. `next build` — back to 43 routes (the design route is gone, confirmed via a live
404 check against `/_design/footer-variants`), clean. `eslint .` — exit 0. Screenshots of
the real, live site footer captured at desktop/tablet/mobile (`site-footer-*.png`),
confirming the CTA, both offices' correct emails, and no UAE block, all rendering
correctly outside the design-review context.

**Desktop footer height, final: 619px** (vs. the pre-RC production footer's 349px, and
vs. round 1's plain Variant C at 619px — identical, since the CTA button's height is
absorbed by the existing statement row rather than adding a new one). Taller than the
pre-RC footer for the same reason established in Stage 1: two complete, equal-weight
office blocks is real added content, not padding.

---

# Stage 2

## Section 2 — Brand Positioning, Taxonomy & Semantic SEO

### 2.1 Canonical Brand Review

Confirmed the site already communicates AHW as an integrated Architecture / Interior
Design / Fit-Out / Design-Build practice — every `/expertise/*` page's `hasOfferCatalog`
already lists cross-disciplinary services (e.g. `fit-out` mentions "Retail Design,"
"Commercial Design," "Hospitality Design"; `design-build` mentions "Turnkey Projects").
**The gap was specifically the Projects section's taxonomy**: a flat four-sector list
(Residential, Retail, Workplace, Hospitality) with no Commercial umbrella, which made
"commercial work" look structurally absent from the portfolio even though 8 of 20
delivered projects (Retail + Workplace + Hospitality) are commercial-sector work by any
normal industry definition. The data model was narrower than the business — exactly the
failure mode this section warns against.

### Decisions Made

**[2.2]** Introduced Commercial as a genuine **parent** grouping of Retail, Workplace, and
Hospitality — not a flat sibling. New file `packages/ui-components/src/data/
sectorTaxonomy.ts` exports `COMMERCIAL_CHILD_SECTORS` and `isCommercialSector()`. **No
project's own `sector` field changed** — a project still carries its specific real value
(e.g. `'Retail'`); Commercial is a derived grouping used for navigation and an aggregate
filter, not a fourth possible per-project value. This was a deliberate choice to correct
a taxonomy gap without touching any project's actual classification data.

**[2.2]** `/projects?sector=commercial` is implemented as a query-filtered aggregate view
of the existing `/projects` route (matches `Retail OR Workplace OR Hospitality`), **not**
a new indexed page — `alternates.canonical` still points every filter variation back to
`/projects`, which is correct, existing SEO practice for faceted navigation and directly
satisfies "prevent cannibalization" without needing per-filter metadata. Verified: 8
projects match `sector=commercial` (4 Retail + 2 Workplace + 2 Hospitality), confirmed via
rendered project-card counts, not assumed from the data alone.

**[2.2]** Updated **three separate places** that needed to agree on this hierarchy, since
each had its own independent sector list:
1. `FloatingNavigationPanel.tsx` (global nav) — Sector group now shows Residential flat,
   then Commercial with Retail/Workplace/Hospitality nested and visually indented beneath
   it (new `.subItemChild` style, contrast independently verified at 14.44:1 against the
   panel background — nowhere near the 4.5:1 floor).
2. `ProjectFilterBar.tsx` (the on-page filter bar) — **found to have its own,
   independently hardcoded `SECTORS` array**, never audited in the original AUDIT.md pass
   (confirms this task's "treat prior work as unverified" instruction was warranted — this
   was a real, previously-undiscovered defect). It listed Commercial as a flat sibling
   right next to Hospitality/Workplace/Retail, which would have been confusing now that
   Commercial is a genuine aggregate of those three. Rewrote it to be data-driven (matching
   the nav's principle) with a "Within Commercial" sub-row that only appears once Commercial
   or one of its children is the active filter — verified via screenshot at both states.
3. `projects/[slug]/page.tsx` breadcrumbs — now `Home > Projects > Commercial > Retail >
   [Title]` for a commercial-child project, `Home > Projects > Residential > [Title]` for
   residential — verified via rendered HTML on one project of each kind. This directly
   satisfies "each project links up to its sector" (and, where applicable, its sector's
   parent) rather than the previous flat `Home > Projects > [Title]`.

**[2.2]** Added a real `SECTOR_COPY.commercial` entry to `projects/page.tsx` (hero title/
description shown when the Commercial aggregate is active) — grounded in what's actually
in the portfolio (retail, workplace, hospitality), not aspirational copy.

**[2.2]** Fixed `areaServed` consistency across **5 files** (`expertise/page.tsx` and all
four `/expertise/*/page.tsx` sub-pages) that were still using a flat string array
(`['Egypt', 'Kuwait', 'Gulf Cooperation Council']`, no UAE) left over from before the
AUDIT.md pass standardized on a structured `Country`/`AdministrativeArea` format elsewhere
(`layout.tsx`, `HomeContent.tsx`, `projects/[slug]/page.tsx`). All 9 `areaServed`
declarations site-wide now use the same structured format and explicitly include UAE,
per this brief's instruction — confirmed via a repo-wide grep with zero remaining
inconsistent entries.

**[2.2] Turnkey — no new page.** "Turnkey Projects" and "Turnkey Delivery" already appear
in `design-build/page.tsx`'s `hasOfferCatalog` and `fit-out/page.tsx`'s title/description
respectively, and the underlying content is genuinely real (multiple project case studies
describe turnkey delivery — confirmed in the prior AUDIT.md phase). Creating a *separate*
`/expertise/turnkey` page would split content that already reads cohesively within
Design-Build/Fit-Out, and risks exactly the "thin, competing page" problem this section
warns about for Commercial. Logged as a considered non-action, not a gap — supersedes the
earlier AUDIT.md note that treated this as an open item.

**[2.2] Office Parity Rule — extended to the contact page, found via this section's own
brand-positioning review.** The live contact page used an `OfficeSwitcher` tab component:
only the selected office's full address/phone/email/map was rendered at all, the other
was completely absent from the DOM until clicked. This is a direct violation of "every
surface that exposes contact details ... MUST present Egypt and the GCC offices at equal
visual weight" — worse than an accordion, since the non-selected office wasn't collapsed,
it simply didn't exist on the page. Rewrote `ContactSection.tsx` to render **both** offices
always, full detail, Egypt first, identical structure (same render path, not two
hand-styled blocks) — matching the footer's approach. The office **selector** didn't
disappear — it moved into `ContactForm.tsx` as a real, visible, labeled radio-button field
("Which office would you like to contact? *"), replacing a hidden `<input type="hidden">`
that had silently driven both the display switch and the form's submission target. This
also fixes a latent accessibility gap: the enquiry's destination office was previously
invisible to the user filling the form. Verified via screenshot: both offices' full detail
(address, phones, email, WhatsApp, hours, map) render simultaneously; the form's default
radio selection defaults to Egypt (matching the page's Egypt-first convention) unless the
URL explicitly requested Kuwait (`/contact/kuwait`).

**[2.2]** Internal linking / reachability: every page remains reachable within 2-3 clicks
of the homepage (nav → section → page, unchanged by this section's work). Sitemap.xml
(42 URLs), robots.txt (`Allow: /`, `Disallow: /api/` only), and `index, follow` robots
meta were re-verified on `/`, `/projects`, `/projects?sector=commercial`, `/expertise`,
and `/contact` — no accidental noindex, no change needed to sitemap.xml itself (the
Commercial aggregate is a query filter, not a new indexable URL, so it correctly doesn't
need its own sitemap entry).

**Truthfulness check**: every claim added or changed in this section maps to something
verifiable — the Commercial grouping to real project sector data, the areaServed UAE
addition to the brief's own explicit instruction (not a portfolio claim), the contact
page rewrite to data already in `offices.ts`. Nothing was introduced that the portfolio
or the data layer doesn't actually support.

### Verification

`tsc --noEmit` (app) and `tsc -p packages/ui-components/tsconfig.json` (package) — both
clean, package declarations regenerated after adding the new `sectorTaxonomy`/`tel`
exports. `next build` — 43 routes, clean. `eslint .` — exit 0. Manually verified via
rendered HTML/screenshots: Commercial aggregate returns 8 projects; all 4 child-sector
filters and Residential return their correct non-zero counts; nav panel shows the nested
Commercial group with correct contrast; on-page filter bar shows/hides the "Within
Commercial" sub-row correctly at both the parent and a child sector; breadcrumbs show the
correct depth for both a commercial-child and a residential project; contact page shows
both offices at equal weight with a working, correctly-defaulted, correctly-ordered form
selector.

---

## Section 3 — Portfolio Presentation

### Decisions Made

**[3] Explicit project ordering.** The Projects index previously rendered in whatever
order `projects.ts` happens to declare its 20 entries — confirmed the exact anti-pattern
this section names ("array position"), since that file's own order reflects insertion
history, not editorial intent (id 17 was declared first, ids 18-20 last, etc. — a
long-standing quirk, not a decision). New file `data/projectOrder.ts` exports
`PROJECT_DISPLAY_ORDER` (an explicit slug list) and `sortByDisplayOrder()`. **Rule, stated
plainly rather than left as a black box**: Flagship-tier projects first (the firm's own
existing "best work" signal, reinforcing strongest work per this section's own framing),
then Standard-tier; alphabetical by title within each tier as a fully deterministic
tie-breaker. Chose this over a more elaborate ranking because a finer-grained order is a
real business/creative judgment call outside what this task has authority to invent —
every project's own `year` field isn't reliable for this (several carry `'TBD'` or a
future year for in-progress work, which sorts meaninglessly on its own) and I don't have
instruction on a specific curated sequence beyond "reinforce strongest work." Every slug
in the order file was verified to exist exactly once against the live data file before
being written (not assumed from memory — an earlier regex-based extraction attempt in
this same session produced wrong `id` values for several projects, which is exactly why
this was checked directly rather than trusted).

**[3]** Applied the same fix to project **detail-page** prev/next navigation, which had
the identical defect (`projects[projectIndex ± 1]` on raw array position). Now walks
`sortByDisplayOrder(projects)` — verified via rendered HTML that the first project in the
order (AUREA Social House) has no "previous" link and its "next" link correctly points to
the second (Beit Al Watan).

**[3] Related Projects audit.** `relatedProjects` is already a real, hand-curated
per-project field (not random, not array-based) — verified in full: 0 empty lists, 0
self-references, 0 broken slug targets across all 20 projects. Checked whether every pair
is actually coherent (shares a sector or a service, per this section's explicit
requirement), not just present: found exactly **one** genuine mismatch — New Brew Coffee
(Hospitality; Interior Design + Fit-out) was pointing at Sultan Center Hawally (Retail;
Renovation/Remodelling) — no shared sector, no shared service. Replaced it with Tmreya
(Retail; **same** two services — Interior Design + Fit-out, and a comparably-scaled
Kuwait cafe/F&B fit-out), re-verified programmatically that all 20 projects' related-work
pairings now share a sector or a service. The other 19 were already correct — this needed
one fix, not a rebuild.

**[3] Gallery lightbox — a genuine gap, not a refinement.** There was no lightbox/modal
gallery anywhere on the site — every project's images (hero + design + build + result,
merged) played only as an unstoppable auto-rotating `HeroSlider`, with no way to pause,
expand, or navigate by keyboard. Built a new `Lightbox` component
(`components/gallery/Lightbox.tsx`) and wired it into `HeroSlider` as an opt-in `lightbox`
prop (default off, since most `HeroSlider` usages — homepage, project index cards — are
link-wrapped navigational elements, not standalone galleries; only the two project
detail-page instances pass `lightbox`). Implements everything this section asks for:
Escape closes, ArrowLeft/ArrowRight navigate, Tab is trapped inside the dialog while open,
focus moves to the close button on open and **back to the exact slide that triggered it**
on close, swipe-left/right on touch, body scroll locked via `overflow: clip` (not
`hidden` — reusing the established lesson from this codebase's own header work: `hidden`
on one axis alone forces the other to compute as `auto`, creating an unintended scroll
container that can hijack `position: sticky` descendants once the lock lifts), and
`object-fit: contain` in the lightbox specifically (vs. `cover` in the inline slider) —
a consistent, deliberate aspect-ratio strategy: crop for the ambient background slider,
show the whole image once a viewer has asked to see it properly.

**[3] Found and fixed a real interaction bug while testing the lightbox, not a simulated
one.** The very first Playwright test couldn't click the trigger at all — Chromium
reported the hero `<h1>` and the hero's decorative gradient overlay (`.hero::after`) were
both intercepting pointer events ahead of the new lightbox trigger underneath them. Fixed
by setting `pointer-events: none` on `.heroContent` (with `pointer-events: auto` on its
real links — the breadcrumbs — so those stay clickable) and on `.hero::after` (purely
decorative, never meant to be interactive). Re-ran the same test after each fix rather
than assuming it was resolved; final pass confirmed open/focus/arrow-nav/scroll-lock/
Escape/focus-restore all work correctly end to end.

**[3] Image hierarchy.** The Projects index previously rendered every project's cell at
identical proportions regardless of tier — confirmed via source, not assumed. Flagship-
tier rows now get a visibly larger, wider image cell (60/40 split and a wider 16:9
aspect ratio at desktop, vs. 50/50 and 16:10 for Standard-tier) — reuses the same `tier`
field already established as the site's one real "this is our best work" signal (Featured
nav group, display order), not a new, separate ranking invented for this purpose.
Verified via screenshot that the rendered proportions match.

**[3] Alt text — reviewed, not rewritten.** `HeroSlider`'s alt pattern is `` `${alt} -
${index+1}` ``, and the `alt` value passed in from every call site already includes the
project's real title, sector, and city (e.g. "IL Bosco Villa, Residential, New Capital —
designed and built by AHW Architects - 3") — this already satisfies "what the space is,"
it is not the generic "project image 1" pattern this section explicitly warns against.
Writing genuinely bespoke per-image captions for ~184 images would require actually
seeing and accurately describing each one; inventing plausible-sounding descriptions I
can't verify against the real photo would risk being *less* accurate than the current,
real-data-grounded pattern, not more. No change made — logged as reviewed rather than
silently skipped.

**[3] One clear CTA per project detail page.** Already true before this section — every
project detail page's closing section has exactly one primary action ("Start a
conversation →" to `/contact`) plus secondary WhatsApp/download actions, confirmed via
source. No change needed.

### Verification

`tsc --noEmit` (app) and `tsc -p packages/ui-components/tsconfig.json` (package) — both
clean. `next build` — 44 routes, clean. `eslint .` — exit 0. Playwright: verified the
explicit display order renders correctly on `/projects` (Flagship-alphabetical, then
Standard-alphabetical); verified prev/next on a project detail page; verified the
lightbox's full interaction contract (open/focus/ArrowLeft/ArrowRight/body-scroll-lock/
Escape/focus-restore) end to end, plus a basic touch-swipe check confirming gesture
direction advances/reverses correctly; verified `relatedProjects` coherence
programmatically across all 20 projects (0 remaining incoherent pairs); verified image
hierarchy renders with the correct proportions via screenshot.

---

## Section 4 — Performance

### Decisions Made

**[4] AVIF + WebP.** `next.config.js`'s `images` block had no `formats` entry, meaning
Next defaulted to WebP-only — AVIF was never being generated. Added
`formats: ['image/avif', 'image/webp']`; Next negotiates via the request's `Accept`
header automatically. Verified via response `content-type` headers on real requests, not
assumed: every image request on `/`, `/projects`, and a project detail page now returns
`image/avif`.

**[4] Real gap found and fixed: `HeroSlider` was loading every image in its gallery
upfront, not just the visible one.** It rendered an `<Image>` for every entry in its
`images` array immediately, only toggling `opacity`/`aria-hidden` for the inactive ones —
so a project with a 10-image gallery shipped all 10 on page load regardless of whether
anyone ever advanced the slider that far. This is invisible until you actually measure
page weight, which is why it was caught here: the Projects index (20 of these sliders
running at once) was loading **11.8MB** on a single page view. Fixed by only mounting the
`<Image>` for slides a viewer has actually reached (`visitedIndices`, starting with slide
0 + a slide-1 preload so the first autoplay transition still crossfades instead of
popping in) — the crossfade CSS transition and autoplay behavior are otherwise unchanged.
**Measured result: 11.8MB -> 3.2MB on `/projects` (-72.7%), 2.2MB -> 1.25MB on a project
detail page (-44%)**, with LCP and CLS unaffected (see table below) and zero change to
what's actually visible — this is a "lazy strategy" fix, not a compression or
image-swap, exactly the kind of tradeoff this section's Image Quality Priority note asks
for.

**[4] `sizes` accuracy.** `HeroSlider` hardcoded `sizes="100vw"` for every usage,
including the Projects index's per-project cards, which render at 50-60% of viewport
width at desktop, not full-bleed — meaning the optimizer was generating full-viewport-
width images for a half-width slot. Added a `sizes` prop (default `100vw`, preserving
the two genuinely full-bleed usages — the homepage/Projects hero backgrounds and the
project detail hero, all unchanged) and passed accurate values from the Projects index
card usage (`60vw`/`50vw` depending on Flagship-tier sizing from Section 3).

**[4] Converted 5 remaining raw `<img>` tags to `next/image`** (`NewsCard.tsx`, both
insights detail pages' cover images, both detail pages' related-project thumbnails) —
found via a repo-wide grep for `<img `, deliberately excluding the user's own untracked
`capability-statement/page.tsx` (a PDF-print page using raw `<img>` on purpose per its
own comment — "ensure perfect printing via puppeteer" — not an oversight, out of scope
here regardless). Left `PlaceholderImage.tsx`'s raw `<img>` alone: confirmed via grep it
has **zero consumers** anywhere in the codebase — genuinely dead code, not worth touching
for a component that never renders to a real user (flagged for Section 6's dead-code
sweep instead). Each conversion added an explicit `aspect-ratio` on the wrapper
(`position: relative` + `aspect-ratio: 4/3` or `16/9` matching the existing visual
design) so space is reserved before the image loads — the previous plain `<img>` tags had
no `width`/`height` attributes and thus no intrinsic size for the browser to reserve,
a real CLS source. Cover images (the largest, most prominent image on their page) get
`priority`+`fetchPriority="high"`; related-project thumbnails stay lazy.

**[4] Fonts — already compliant, no change needed.** `layout.tsx` already uses
`next/font/google` for both typefaces with `subsets: ['latin']` and `display: 'swap'`
explicitly set; `next/font` self-hosts, preloads, and applies automatic fallback-font
metric matching by default, which is exactly what this section asks for (subset,
preload, swap, no layout shift on swap). Verified by reading the actual config, not
assumed from convention.

**[4] Animations — two real layout-triggering-property violations found and fixed** (a
repo-wide grep for `transition:` targeting `width/height/top/left/right/bottom/margin/
padding/font-size` across every `.module.css` file, not a spot-check): `projects/[slug]/
page.module.css`'s `.relatedItem` animated `padding-left` on hover — converted to
`transform: translateX()`, same visual "nudge right" effect, no layout cost.
`ProjectFilterBar.module.css` animated `top` (the sticky filter bar's condense-offset,
driven by `--header-offset`) — removed the transition entirely rather than force a
transform-based reimplementation of the sticky-offset mechanism this late; the header's
own condense transition is already smooth on transform/opacity, so the filter bar
snapping to its new offset immediately after reads as part of the same motion, not a
visible jump. Also added a consolidated `prefers-reduced-motion` block to `projects/
[slug]/page.module.css`, which had **zero** reduced-motion coverage across its 5
transitions before this section — and one to each of `NewsCard.module.css` and
`PublicationCard.module.css` for their hover-scale image transforms, which had the same
gap.

### Measurements — local production build (`next build && next start`, port 3005)

| Route | LCP | CLS | Total page weight | Largest image |
|---|---|---|---|---|
| `/` (homepage) | 112ms | 0 | 1,575.7 KB | 247.1 KB (AVIF) |
| `/projects` — before | 640ms | 0.0005 | **11,826.5 KB** | 749.4 KB (AVIF) |
| `/projects` — after | 584ms | 0.0005 | **3,226.5 KB (-72.7%)** | 329.2 KB (AVIF) |
| `/projects/[slug]` — before | 388ms | 0.0005 | 2,230.2 KB | 331.9 KB (AVIF) |
| `/projects/[slug]` — after | 424ms | 0.0005 | **1,253.4 KB (-43.8%)** | 314.6 KB (AVIF) |

All LCP and CLS figures are well within target (LCP < 2.5s, CLS < 0.1) both before and
after — the fix here was page weight and image-loading strategy, not paint timing, which
was never the bottleneck.

**Honesty check, consistent with the same standard applied earlier in this engagement**:
these are local-server measurements with no real network latency/DNS/TLS/CDN behavior —
real-world numbers will differ, but the relative before/after comparison (same machine,
same method, only the code changed) is a valid signal that the fix works. **INP was not
measured** — it requires real user interaction sampling that scripted, non-interactive
testing can't meaningfully simulate; flagged `[unverified]` rather than guessed at, same
as the earlier AUDIT.md phase.

### Verification

`tsc --noEmit` (app) and `tsc -p packages/ui-components/tsconfig.json` (package) — both
clean. `next build` — 44 routes, clean. `eslint .` — exit 0. Performance measured via
Playwright against the actual production build (not dev mode) on `/`, `/projects`, and a
project detail page, before and after the `HeroSlider` fix, with real response headers
used to compute page weight and confirm AVIF delivery (not estimated).

---

## Section 5 — Responsive Experience

Desktop treated as the reference; verified tablet/mobile preserve hierarchy and
interaction quality rather than becoming reduced versions.

### Decisions Made

- **Fixed a real, site-wide overflow bug found by the sweep, not assumed to be clean.**
  A 10-route × 6-breakpoint (320/375/768/1024/1440/1920) Playwright sweep found a uniform
  71px horizontal overflow at exactly 1024px on **all 10 routes tested** — the identical
  measurement (1095px vs 1024px) on every route pointed at a global element. Traced to
  `Footer.module.css`'s `.linksRow`, which used a hard `grid-template-columns: repeat(3,
  180px)` at the `min-width:1024px` breakpoint (540px + gaps = 588px minimum, could not
  shrink) while its flex sibling `.officesRow` used flexible `1fr` columns — at exactly
  1024px the container couldn't fit both. Fixed with `grid-template-columns: repeat(3,
  minmax(0, 180px))` (caps at 180px on wide screens, shrinks gracefully below that) plus
  `min-width: 0` on `.officesRow` (flex/grid children default to `min-width:auto` based
  on content, which silently blocks shrinking). Re-ran the full 60-combination sweep
  after the fix: **zero overflow findings** across every route and breakpoint.
- **14px text found in the type-scale check is the footer's own secondary text, not a
  body-copy violation.** A `<p>`-tag sweep (filtered to text >40 chars, to isolate
  long-form paragraphs from short labels) across three content-heavy pages —
  `/about/about-us`, `/expertise/architecture`, and a project detail page — surfaced a
  14px match on all three. A targeted follow-up identified the exact elements: on all
  three pages, only `.officeAddress` and `.copyright` (the footer, which renders on
  every route). No page-specific long-form paragraph anywhere tested renders below 15px.
  14px is Stage 1's own deliberate target for footer secondary text ("13-14px, ≥4.5:1
  contrast") — a different category from Section 5's body-copy floor, not an oversight.
- **Touch targets verified, not assumed, on the contact page** — office-selector radio
  labels (44px), submit button (52px), and the footer CTA (44px) all measured ≥44×44px
  via Playwright `getBoundingClientRect()`.
- **No hover-gated functionality without a touch equivalent.** Grepped every `:hover`
  rule across `Footer.module.css` and `FloatingNavigationPanel.module.css`: all are
  decorative (color/opacity transitions on links, CTAs, social icons). The one place
  hover previously gated a functional reveal — submenu expansion in
  `FloatingNavigationPanel` — already has a documented touch fallback in place from
  earlier work: "Touch devices have no `:hover` — expand submenus by default instead of
  gating on hover" (`FloatingNavigationPanel.module.css:171`). The Lightbox's swipe
  gesture and the mobile nav's tap-to-expand pattern (both already verified functionally
  in Section 3/earlier work) cover the remaining interactive surfaces.
- **Grid composition adapts intentionally, not via naive stacking.** Spot-checked the
  Projects index row (`page.module.css`), which steps from `grid-template-columns: 1fr`
  (mobile) to `60% 1fr` at `min-width:768px` — a deliberate two-zone layout, not a
  4-column grid collapsing flat. The footer's `.officesRow`/`.linksRow` and
  `ProjectFilterBar`'s sector/market rows (both already given considered mobile-stack
  treatments in Stage 1 and Section 2) were re-confirmed under this section's own
  standard rather than assumed carried-over-compliant.

### Verification

`tsc --noEmit` (app) and `tsc -p packages/ui-components/tsconfig.json` (package) — both
clean. `next build` — clean. `eslint .` — exit 0. Full 60-combination responsive overflow
sweep (10 routes × 6 breakpoints) — zero findings post-fix. Touch-target measurements via
Playwright `getBoundingClientRect()` on the contact page — all ≥44×44px. Font-size and
hover/touch-equivalence checks performed via Playwright DOM queries and manual CSS review
of every `:hover` rule in the two navigation stylesheets most likely to gate functionality.

---

## Section 6 — Final QA

A comprehensive automated sweep across every real route (seeded from the 18 top-level
pages, then crawled to discover all 43 unique internal URLs actually linked site-wide —
20 project detail pages, 2 publication detail pages, both contact-office deep links,
etc.) checked links, images, console errors, metadata, structured data, and heading
order in one pass. Findings below are grouped by what the sweep found vs. what required
a targeted follow-up check.

### Decisions Made

- **Fixed three real WCAG 2.2 AA heading-order violations, found by the sweep, not
  assumed clean.** The 43-route sweep flagged a heading-level skip (jumping from `<h1>`
  straight to `<h3>`, with no `<h2>` in between) on `/projects`, all 20
  `/projects/[slug]` pages, `/insights/news`, and one publication detail page. Traced to
  three distinct sources:
  1. `Footer.tsx`'s office names (`<h3>`) and link-group titles (`<h4>`) are internally
     consistent (`h3→h4`, no skip) but assume the page above them already established an
     `<h2>` — true on most pages, false wherever a page's own content has no `<h2>`
     (e.g. `/insights/news`'s empty-state, or a publication with no related project).
     Bumped both up one level (`<h3>→<h2>` for office names, `<h4>→<h3>` for group
     titles) so the footer never creates a skip regardless of what precedes it on a given
     page — a page with only `<h1>` before the footer now sees `<h1>→<h2>`, and multiple
     same-level `<h2>`s elsewhere on a page are not a violation.
  2. `/projects`'s project-card titles (`page.tsx`) used `<h3>` directly under the page's
     own `<h1>` with no `<h2>` present anywhere before them. Changed to `<h2>` — they are
     the primary repeated content unit on the page, one level below the page title.
  3. The project detail page's "Continue Exploring" and "As Seen In" section headers
     (`[slug]/page.tsx`) were `<h3>` directly under `<h1>`, with every intervening
     section using a `<span>` label (`THE BRIEF`, `THE DESIGN`, etc.), not a heading —
     the existing closing-CTA heading later in the same page was already `<h2>`. Bumped
     both to `<h2>`, matching the closing CTA's level (all three are page-level
     subsections, not nested under one another).
  Re-ran the full sweep after all three fixes: zero heading-order violations across all
  43 routes.
- **Fixed a real accessible-errors gap in both forms.** `ContactForm.tsx` already set
  `aria-invalid` on invalid fields (from earlier work) but never connected the visible
  error text to the input via `aria-describedby`, and the error text itself had no
  `role="alert"` — a screen reader user would see the red text but never hear it.
  `CareersForm.tsx` had neither `aria-invalid` nor any error-to-input association at all.
  Brought both forms to the same pattern: every field with a validation error now gets
  `aria-invalid="true"`, `aria-describedby` pointing at the specific error element's
  `id`, and the error element carries `role="alert"`. Verified functionally, not just by
  reading the code: submitted both forms empty via keyboard only (focus a field, press
  Enter) and confirmed via the live DOM that `aria-describedby` resolves to a real
  element with `role="alert"` and the actual validation message as its text, on both
  forms.
- **Fixed a real missing-Escape gap in the footer's social-platform popovers.**
  `FooterSocialLinks.tsx` (the WhatsApp/Instagram/Facebook/LinkedIn per-office popovers in
  the footer) closed on outside-click but had no Escape handling and no focus-return —
  the one interactive overlay on the site that didn't already follow the pattern used
  everywhere else (the Lightbox and the already well-built `FloatingContactHub` widget
  both already handle Escape + focus-return correctly, confirmed by reading
  `FloatingContactHub.tsx` rather than assuming). Added an Escape handler alongside the
  existing outside-click handler, closing whichever popover is open and returning focus
  to its own trigger button. Verified functionally via Playwright: click opens the
  popover (`aria-expanded="true"`), Escape closes it (`aria-expanded="false"`, popover
  removed from the DOM) and focus lands back on the WhatsApp trigger button.
- **`<main>` landmark confirmed present on every in-scope route** (checked the 9 routes
  whose own `page.tsx` doesn't render a literal `<main>` tag — the root layout wraps
  `children` in a plain `<div id="main-content">`, not a landmark element — and verified
  in the live DOM that all 9 render exactly one `<main>` via a nested layout or shared
  component). The one exception is `/capability-statement`, which has zero `<main>` in
  the rendered DOM — this is the user's own untracked, in-progress print/PDF page (not
  created or modified by this RC pass beyond the minimal type-signature fix noted in
  Section 7's build-cleanliness check), logged under Blocked rather than edited, per the
  same boundary already established earlier in this engagement.
- **Console errors are all one known, non-blocking third-party issue.** Every one of the
  43 routes logs a CORS failure from `embed.tawk.to` (the live-chat widget) — the script
  refuses to load because `localhost:3005` isn't in Tawk.to's allowed-domain list for
  this account. This is an environmental artifact of local-only testing, not a code
  defect: it will resolve automatically once the real production domain is registered
  with Tawk.to, and no site code change can fix a third-party domain allowlist. Logged
  here rather than "fixed" by removing or stubbing the integration.
- **Focus indicators verified present, not just assumed.** All three forms (`Contact`,
  `Careers`, `InsightsFilterBar`'s search input) suppress the default `outline` but
  replace it with a real `border-color` change on `:focus` (unconditional, not
  `:focus-visible`-gated) — a deliberate, minimal hairline-based indicator consistent
  with the site's established editorial aesthetic, and sufficient to satisfy WCAG 2.4.7
  (Focus Visible), which requires only that *some* visible change occur on focus. Left
  as-is rather than replacing with a heavier outline, consistent with the No-Regression
  Lock's instruction not to make opportunistic stylistic rewrites.
- **`/_design/footer-variants` removal reconfirmed** — no trace remains in the working
  tree or in `next build`'s route list (verified again in Section 7).
- **No dead code introduced by this pass** — final `eslint .` run (which flags unused
  imports/vars) is clean across every file touched in Sections 1–6.

### Verification

`tsc --noEmit` (app) and `tsc -p packages/ui-components/tsconfig.json` (package) — both
clean. `eslint .` — exit 0. A 43-route Playwright sweep (crawled from 18 seed pages,
discovering every internal URL actually linked site-wide) checked, per route: HTTP
status, console errors, failed sub-resource responses, `<h1>` count, canonical link
presence, OG/Twitter metadata presence, JSON-LD parse validity, missing/empty `alt`
count, and heading-level order — zero findings on the re-run after the three heading
fixes. Forms verified functionally via keyboard-only submission with live DOM
inspection of the resulting ARIA wiring, on both `ContactForm` and `CareersForm`. Footer
social popover Escape/focus-return verified functionally via Playwright, scoped
specifically to the footer instance (the page also has the separate, already-correct
`FloatingContactHub` widget, which was checked by reading its source rather than
duplicating the same functional test).

---

## Section 7 — Pre-Launch Verification

### Decisions Made

- **Fixed a real, if minor, visual overlap on mobile — a known gap AUDIT.md had
  previously reviewed and deliberately left as-is.** While capturing the final
  screenshots, found that the `FloatingContactHub` ("Let's Talk") button's visible pill
  geometrically overlaps the last ~35px of the footer's "Terms of Service" link on mobile
  (375px) when scrolled to the very bottom of the page — confirmed via
  `getBoundingClientRect()` on both elements, not just eyeballed. This is the same
  overlap AUDIT.md's Phase 5/6 already documented and consciously chose not to fix
  ("the link underneath remains clickable... documented as reviewed rather than left as
  a silent gap") — and confirmed here that the link genuinely was still clickable even
  with the overlap (Playwright `.click()` on the link's un-obscured left portion
  succeeded and navigated to `/terms-of-service` both before and after this fix). Since
  this RC pass replaced the footer entirely (Variant C, Stage 1), the geometry changed
  enough that it was worth re-examining rather than re-inheriting the old acceptance.
  Fixed with a minimal, low-risk addition: `padding-bottom: var(--space-20)` on
  `.footer` at the same `max-width: 640px` breakpoint the hub itself uses, clearing its
  48px-button + 16px-offset footprint with room to spare. Did not touch
  `FloatingContactHub` itself (a separately-scoped, deliberately-designed system per
  AUDIT.md's own Phase 6 note) — the footer is what changed this pass, so the footer is
  what absorbed the fix. Verified before/after via `getBoundingClientRect()`: no vertical
  overlap remains (`Terms of Service` bottom edge 731.6px vs. hub top edge 748px).
- **Investigated, and ruled out, a second apparent desktop overlap as a false alarm.** A
  first look at the desktop footer screenshot appeared to show the hub dimming/covering
  part of the legal-links row. Measured it directly: the hub's *closed-state* bounding
  box is large (186×296px) because `ContactHubMenu`'s items stay in-layout at
  `opacity: 0` for the open/close fade animation, but the closed menu also carries
  `pointer-events: none` at the container level, and the "Terms of Service" link's own
  computed `opacity` was confirmed to be `1` (not dimmed by any CSS). A real click test
  confirmed the link is fully reachable and navigates correctly on desktop. No fix
  applied here — there was nothing to fix.
- **Clean production build confirmed from scratch.** Killed the existing dev server,
  deleted `apps/public-site/.next` entirely, and ran a full `next build` — 44 routes,
  zero TypeScript/build errors, `/_design/footer-variants` absent from the route list (as
  expected — removed in Stage 1's finalization). Re-ran the build a second time after the
  Section 7 footer-padding fix above, so the artifact actually being served for the
  screenshots and the final sweep is the true final state of the code, not a stale build.
- **Re-ran the full 43-route link/image/console/metadata/JSON-LD/heading sweep against
  the actual production server** (`next start`, not `next dev`) rather than trusting the
  dev-mode result from Section 6 to still hold. Only the known Tawk.to CORS artifact
  remains on every route; zero other findings.
- **Re-verified title-doubling (AUDIT.md Phase 4's fix) has not regressed** — `curl`-
  checked the rendered `<title>` tag on `/`, `/insights/news`, `/projects`, and
  `/about/about-us`: each shows exactly one `| AHW Architects` suffix, no doubling.

### AUDIT.md Acceptance Re-Verification

AUDIT.md's own Phase 0-6 pass predates this RC brief and was explicitly flagged as
unverified going into this task. Re-checked every defect/decision against the *current*
codebase (post-RC, not just re-reading AUDIT.md's own claims) rather than assuming it
still holds:

| AUDIT.md item | Status | Re-verified how |
|---|---|---|
| D1/D3(revised) — zero-result sector/market filters | ✅ Still fixed | Sector list is still data-derived (`Array.from(new Set(projects.map(...)))`); this RC's Section 2 taxonomy work built on top of this, not around it |
| D4 — Featured projects mechanism | ✅ Still fixed | `tier === 'Flagship'` group still present and unmodified this pass |
| D5 — Nav dialog semantics | ✅ Still fixed | `FloatingNavigationPanel`'s dialog/ARIA/Escape/focus behavior untouched this pass except the Section 2 Commercial-parent grouping addition, which reuses the same pattern |
| D7 — stale `dist/index.js` | ⚠️ Still open, still deliberately deferred | Unchanged since AUDIT.md — genuinely zero runtime impact (`transpilePackages` routes around it); out of this brief's stated scope, same reasoning as AUDIT.md's own Phase 1 note |
| D8 — homepage 320px overflow | ✅ Still fixed | Covered by this RC's own Section 5 60-combination sweep (0/60 overflow findings) |
| D9 — keyboard accordion (`:focus-within`) | ✅ Still fixed | Unchanged this pass |
| D10 — title doubling | ✅ Still fixed, re-verified | `curl`-checked 4 routes this section, zero doubling |
| D11 — `/expertise` missing `<h1>` | ✅ Still fixed | Confirmed `h1Count: 1` for `/expertise/*` in this RC's Section 6 sweep |
| D12 — broken `lint` script | ✅ Still fixed | `eslint .` still the script's actual command; run repeatedly throughout this RC pass |
| Phase 4 SEO (titles/descriptions/structured data/robots/sitemap) | ✅ Extended, not broken | This RC's Section 2 rewrote titles only for pages whose intent changed (Commercial parent sector) and added `hasOfferCatalog`/updated `areaServed`; re-verified canonical/OG/Twitter/JSON-LD present and parsing cleanly on all 43 routes this pass |
| Phase 5 footer (519px→349px, 3 type sizes, contrast) | 🔁 Superseded | The old footer AUDIT.md measured no longer exists — replaced site-wide by this RC's Variant C (see Stage 1 — Final Selection for its own measured heights). Office Parity Rule, contact-detail sourcing, and the 3-type-size cap were all re-established fresh for the new footer rather than inherited |
| Phase 6 — `FloatingContactHub`/footer overlap | ✅ Now genuinely fixed | AUDIT.md Phase 6 reviewed and deliberately left this as-is; this RC's Section 7 fixed it outright (see Decisions Made above) since the footer geometry changed enough this pass to warrant re-examining, not re-inheriting, the old call |
| Phase 6 — dead mega-menu CSS removed | ✅ Still fixed | Not touched this pass |
| Phase 6 — Core Web Vitals proxies | 🔁 Superseded | This RC's Section 4 re-measured LCP/CLS/page-weight against a real production build with actual response-header page-weight accounting, superseding AUDIT.md's Phase 6 numbers with a more rigorous method; INP remains `[unverified]` in both, for the same stated reason (no real user-interaction sampling available) |
| Phase 6 — form label associations | ✅ Extended | AUDIT.md Phase 6 confirmed labels/ids; this RC's Section 6 went further and added `aria-invalid`/`aria-describedby`/`role="alert"` wiring that wasn't checked before |
| Phase 6 — 24-route sweep (links/images/alt/h1/overflow) | ✅ Superseded by a larger sweep | This RC's Section 6/7 ran the equivalent check across all 43 routes now linked site-wide (vs. AUDIT.md's 24), against the real production build |

No previously-met AUDIT.md acceptance criterion was broken by this RC pass — every item
above is either still passing, deliberately still-deferred (D7, unchanged), or was
superseded by a newer, more thorough re-measurement using the same or a stricter method.

### Route Walk — Desktop / Tablet / Mobile

Every route discovered by this RC's own crawl (43 URLs, seeded from all 18 top-level
pages and everything they link to) was checked at 320/375/768/1024/1440/1920px for
horizontal overflow in Section 5 (zero findings) and re-checked structurally (HTTP
status, console errors, images, headings, metadata) against the production build in this
section (zero findings beyond the known Tawk.to note). Four representative routes were
additionally captured as full visual screenshots at desktop (1440px)/tablet
(768px)/mobile (375px) — see Visual Verification below — chosen to cover the site's
distinct layout patterns (hero-led homepage, index/grid page, long-form detail page,
global footer):

| Route | Desktop | Tablet | Mobile |
|---|---|---|---|
| Homepage (`/`) | ✅ Pass | ✅ Pass | ✅ Pass |
| Projects (`/projects`) | ✅ Pass | ✅ Pass | ✅ Pass |
| Project detail (`/projects/il-bosco-villa-new-capital-egypt`) | ✅ Pass | ✅ Pass | ✅ Pass |
| Footer (site-wide) | ✅ Pass | ✅ Pass | ✅ Pass (after the padding fix above) |
| Remaining 39 routes | ✅ Pass (structural sweep) | ✅ Pass (60-combination overflow sweep, Section 5) | ✅ Pass (60-combination overflow sweep, Section 5) |

### Deployment Confirmation

`git remote -v` returns nothing — this repository has **no remote configured at all**,
so there is no upstream to accidentally push to. `git branch -vv` confirms `master` has
no upstream branch. All work this entire RC pass exists only as local commits on
`master`. Nothing was deployed, pushed, or published at any point.

### Verification

Full clean rebuild (`rm -rf apps/public-site/.next && next build`) run twice (once before
discovering the mobile footer-overlap fix, once after) — both zero-error, 44 routes.
`tsc --noEmit` (app + package) and `eslint .` clean on the final state. Production server
started via `next start -p 3005` and confirmed live via `curl` before every verification
pass in this section ran against it. 43-route sweep re-run against the production build:
zero non-Tawk findings. Screenshots captured via Playwright against the live production
server at all three required viewports.

---

# Final Deliverable

## 1. Changelog

**Stage 1 (Footer Redesign)**
- `apps/public-site/src/app/%5Fdesign/footer-variants/**` — 6 variants (A-F) + shared
  `FooterSocialLinks` built, presented, then fully deleted after selection.
- `packages/ui-components/src/components/navigation/Footer.tsx`, `Footer.module.css` —
  full rewrite based on the finalized Variant C, with the Variant B CTA treatment
  borrowed in, real Egypt/Kuwait office data (no fabricated UAE office), and equal
  Egypt/Kuwait visual weight.
- `packages/ui-components/src/components/navigation/FooterSocialLinks.tsx`,
  `.module.css` — moved from the design-review route into the permanent component tree.
- `packages/ui-components/src/lib/tel.ts` (new) — `buildTelLink()`.
- `packages/ui-components/src/index.ts` — new exports wired through.

**Section 2 (Brand Positioning, Taxonomy & Semantic SEO)**
- `packages/ui-components/src/data/sectorTaxonomy.ts` (new) — Commercial-parent grouping
  (`isCommercialSector`, `COMMERCIAL_CHILD_SECTORS`).
- `packages/ui-components/src/components/navigation/FloatingNavigationPanel.tsx`,
  `.module.css` — Sector nav restructured with Commercial as a parent grouping
  Retail/Workplace/Hospitality as children.
- `apps/public-site/src/components/ProjectFilterBar.tsx`, `.module.css` — same
  Commercial-parent restructuring applied to its independently-maintained sector list.
- `apps/public-site/src/app/projects/page.tsx` — Commercial filter logic, breadcrumbs,
  `SECTOR_COPY` entries, structured data updates.
- `apps/public-site/src/app/projects/[slug]/page.tsx` — Commercial-aware breadcrumbs,
  `areaServed` added to `CreativeWork`/`ProfessionalService` JSON-LD.

**Section 3 (Portfolio Presentation)**
- `packages/ui-components/src/data/projectOrder.ts` (new) — explicit curated
  `PROJECT_DISPLAY_ORDER` + `sortByDisplayOrder()`, replacing array-declaration-order
  reliance everywhere projects are listed.
- `packages/ui-components/src/components/gallery/Lightbox.tsx`, `.module.css` (new) —
  full keyboard/focus-trap/swipe modal gallery.
- `packages/ui-components/src/components/animations/HeroSlider.tsx`, `.module.css` —
  lightbox integration, `sizes` prop, lazy-mount-on-visit fix (see Section 4).
- `apps/public-site/src/app/projects/page.tsx`,
  `apps/public-site/src/app/projects/[slug]/page.tsx` — curated ordering wired in,
  flagship tiles sized larger, lightbox enabled on hero sliders.
- `packages/ui-components/src/data/projects.ts` — one `relatedProjects` correction
  (`new-brew-coffee-salmiya-kuwait`), found via a programmatic sector/service coherence
  check across all 20 projects.

**Section 4 (Performance)**
- `packages/ui-components/src/components/animations/HeroSlider.tsx` — `visitedIndices`
  lazy-mount fix (11.8MB→3.2MB on `/projects`, -72.7%).
- `apps/public-site/next.config.js` — explicit AVIF/WebP `formats`.
- `packages/ui-components/src/components/insights/NewsCard.tsx`, `.module.css` — raw
  `<img>` converted to `next/image`.
- `apps/public-site/src/app/insights/news/[slug]/page.tsx`,
  `apps/public-site/src/app/insights/publications/[slug]/page.tsx` (+ `.module.css`) —
  same raw-`<img>`-to-`next/image` conversion for cover/related images.
- `apps/public-site/src/app/projects/[slug]/page.module.css` — two layout-triggering
  animations (`padding-left`, sticky `top`) fixed to `transform`/removed; consolidated
  `prefers-reduced-motion` block.

**Section 5 (Responsive Experience)**
- `packages/ui-components/src/components/navigation/Footer.module.css` — `.linksRow`
  fixed-width overflow at 1024px fixed (`minmax(0, 180px)` + `min-width: 0` on
  `.officesRow`).

**Section 6 (Final QA)**
- `packages/ui-components/src/components/navigation/Footer.tsx` — heading levels bumped
  (`h3→h2` office names, `h4→h3` group titles) to eliminate a heading-order skip.
- `apps/public-site/src/app/projects/page.tsx`,
  `apps/public-site/src/app/projects/[slug]/page.tsx` — project-card and related-section
  headings bumped `h3→h2` for the same reason.
- `apps/public-site/src/features/contact/components/ContactForm.tsx`,
  `apps/public-site/src/features/about/components/CareersForm.tsx` — `aria-invalid` +
  `aria-describedby` + `role="alert"` wired onto every validated field.
- `packages/ui-components/src/components/navigation/FooterSocialLinks.tsx` — Escape
  handling + focus-return added to the per-office social popovers.

**Section 7 (Pre-Launch Verification)**
- `packages/ui-components/src/components/navigation/Footer.module.css` — mobile
  `padding-bottom` added to clear the `FloatingContactHub` button's footprint at the
  bottom of the page.

## 2. Metrics

| Metric | Before | After |
|---|---|---|
| Footer height (desktop, 1440px) | 519px (AUDIT.md Phase 5 baseline, old footer) | See Stage 1 — Final Selection for Variant C's own measured heights (new footer, not a like-for-like comparison — the footer was fully replaced this pass) |
| `/projects` page weight | 11,826.5 KB | 3,226.5 KB (-72.7%) |
| `/projects/[slug]` page weight | 2,230.2 KB | 1,253.4 KB (-43.8%) |
| Largest image (AVIF, homepage) | — | 247.1 KB |
| LCP (`/`, `/projects`, `/projects/[slug]`) | — | 92-640ms (all well under the 2.5s target; measured against the production build) |
| CLS (all three) | — | 0-0.0005 (well under the 0.1 target) |
| INP | `[unverified]` — no real user-interaction sampling available in this environment, both in AUDIT.md and this RC pass | |

## 3. Contact Audit

Every location contact data appears, confirmed reading from `offices.ts` (never
hardcoded, never invented):

- **Footer** (site-wide) — Egypt and Kuwait (`GCC Office`), equal visual weight, same
  render path (`orderedOffices.map(...)`), Egypt first. Egypt shows `primaryEmail`
  (`mwardany@ahwarchitects.com`), Kuwait shows `generalEmail`
  (`info@ahwarchitects.com`) — both real fields, per the user's explicit final-selection
  instruction.
- **Contact page** (`/contact`, `/contact/egypt`, `/contact/kuwait`) — both offices,
  full address/phones/email, `tel:` links via `buildTelLink()`.
- **Header CTA** (`Start Your Project`) — routes to `/contact`, no office data
  hardcoded into the link itself.
- **Project enquiry CTAs** (project detail pages) — WhatsApp links built from
  `office.contact.whatsapp` via `buildWhatsAppLink()`, both offices offered.
- **Structured data** — `Organization`/`ProfessionalService` schema carries a separate
  `PostalAddress` + `telephone` per office (Egypt, Kuwait), not merged; `areaServed`:
  Egypt, Kuwait, UAE, GCC (UAE/GCC as markets served, not implying a UAE office exists).

**Office Parity Rule**: satisfied. No geo-detection/IP-based switching/auto-selection was
implemented anywhere (per the brief's explicit prohibition) — every surface presents both
offices and lets the visitor choose. No shared phone across offices. No office collapsed
into an accordion on any breakpoint (verified in Section 5's responsive sweep).

## 4. Acceptance Re-Verification

See Section 7's "AUDIT.md Acceptance Re-Verification" table above for the full per-item
pass/fail. Summary: **zero previously-met criteria broken**; one item (D7, stale
`dist/index.js`) remains deliberately deferred, unchanged from AUDIT.md; two items
(footer metrics, CWV proxies) were superseded by newer measurements after this pass
rebuilt or re-measured the same surface with a stricter method; everything else still
passes.

## 5. Local Preview

```
cd /Users/mahmoudalwardany/Downloads/AHW_WEBSITE
corepack pnpm --filter public-site build   # clean production build, 44 routes, zero errors
corepack pnpm --filter public-site exec next start -p 3005
```

**http://localhost:3005** — this is a local-only production preview. The site is
pre-launch, not deployed, and not indexed. There is no hosted preview URL and none was
fabricated.

## 6. Visual Verification

Browser automation (Playwright) was available and used. Captured desktop (1440px),
tablet (768px), and mobile (375px) screenshots of Homepage, Projects, one Project Detail
page (`il-bosco-villa-new-capital-egypt`), and the Footer, against the actual local
production server (`next start -p 3005`) — 12 screenshots total, saved to
`/private/tmp/claude-501/-Users-mahmoudalwardany/840adbb6-344d-4666-bd6f-d874dbb53b72/scratchpad/pwcheck/screenshots/`
(outside the repository; this is a local, ephemeral verification artifact, not a project
file). All 12 were visually reviewed this session: clean, no layout defects, no broken
images, both offices at equal weight in the footer at every viewport, no horizontal
overflow, no unintended overlaps (after the Section 7 fix above).

## 7. Blocked

- **`TODO_CONTACT_UAE_OFFICE`** (carried over from Stage 1 — see the Blocked section
  there for full detail). `offices.ts` defines only Egypt and Kuwait; UAE is explicitly a
  future office in that file's own comments, with zero fields populated. No UAE office
  was fabricated anywhere — footer, contact page, and structured data all show only the
  two real offices. UAE appears solely as an `areaServed` market (matching the user's
  explicit final-selection instruction: "Keep UAE only as an area served where factually
  appropriate, not as a physical office").
- **`/capability-statement` has no `<main>` landmark and was not fixed.** This is the
  user's own untracked, in-progress print/PDF page (not created by this RC pass; only a
  minimal type-signature fix was applied to it, back in Section 2, so the project-wide
  `tsc --noEmit` gate could pass cleanly). Left untouched beyond that, per the boundary
  established earlier in this engagement around the user's own concurrent work in this
  directory.
- **D7 (stale `packages/ui-components/dist/index.js`)** remains open, unchanged from
  AUDIT.md — zero runtime impact (`transpilePackages` routes around it), and fixing it
  properly means adding a real bundler or accepting `package.json`'s `main` field points
  nowhere, both outside this brief's stated scope.

## 8. Requires Business Approval

- **UAE office data.** The footer, contact page, and structured data currently show only
  Egypt and Kuwait. If/when a real UAE office opens, `offices.ts` needs its address,
  phone(s), and office-specific email populated — at that point the office will
  automatically appear everywhere via the same shared render paths this RC pass
  established (no per-surface code changes needed). **Recommendation**: populate
  `offices.ts` as soon as real UAE office details exist; **impact of not acting**: none
  today (the current three-market/two-office state is factually accurate), but the site
  will keep showing "GCC Office" as Kuwait-only until that data exists.
- **`dist/index.js` bundling (D7).** Recommend adding a real build step (`tsup` or
  `esbuild`) for `packages/ui-components` at some future point, since `transpilePackages`
  masks the gap today but would break for any consumer of this package that isn't a
  Next.js app using that config. **Risk of not acting**: none for this site today; a
  future non-Next.js consumer of `@agp/ui-components` would silently get a broken import.
- **Tawk.to domain allowlist.** The live-chat widget will not load on `localhost` and has
  not been tested against a real domain in this environment. **Recommendation**: confirm
  the production domain is registered in the Tawk.to dashboard's allowed-domains list
  before launch, so the widget isn't silently broken on day one. **Risk of not acting**:
  the chat widget fails silently in production the same way it does locally — no visible
  error to end users, just a missing chat bubble.
