# AHW Architects — Pre-Launch Fixes (Stage A)

Local dev server: `http://localhost:3005` (Next.js 16.2.12, `corepack pnpm exec next dev -p 3005` from `apps/public-site`).

---

## A1 — Leadership image not rendering on /about/about-us

**Root cause:** the code referenced `/images/about/both_partner.png` (lowercase), but the
actual file placed in the working directory was `both_partner.PNG` (uppercase, and —
discovered mid-fix — untracked by git entirely, so its "disappearance" when removed
never showed up in `git status`). This works by accident on macOS's case-insensitive
filesystem and 404s on any case-sensitive production host (Linux, Vercel, most Docker
images) — exactly the kind of bug that only surfaces after deploy.

**Deeper issue found on inspection, not assumed:** the actual asset is not a leadership
portrait. It's a full AI-generated marketing poster/collage (A+W wordmark, "WE BUILD
LEGACIES" tagline, service icons, unrelated construction/interior photos, and baked-in
stats — "15+ Years", "250+ Projects Delivered" — not verified against this site's own
figures) with **no alpha channel** (`hasAlpha: false`, confirmed via `sharp` metadata)
despite being described as having a transparent background.

**Fix:** cropped a clean two-figure portrait region from the same source file (real
pixels only), crushed the shadow levels to flatten the poster's checkerboard
transparency-preview artifact, and saved as JPEG rather than PNG — Next's image
optimizer was palette-quantizing the PNG at default quality and reintroducing visible
banding in the crushed shadows; JPEG's DCT compression handles the dark gradient
cleanly. Updated the component's `src`, added a descriptive alt naming both leaders by
name and title (`Ahmed Al Wardany, Founder and Principal, and Mahmoud Al Wardany,
Managing Partner and Egypt CEO, of AHW Architects`), added `loading="lazy"`.

**Files touched:** `apps/public-site/src/app/about/about-us/page.tsx`,
`apps/public-site/public/images/about/ahw-leadership-portrait.jpg` (new).

**Verified:** rendered in both dark and light theme via the running dev server
(screenshots taken, not just read from source). Audited the repo for other
absolute-path-outside-project or case-mismatched asset references — none found.

**Decisions:** cropping+treating a derivative from the supplied poster (rather than
rendering nothing, or rendering the poster as-is) was the simplest option that didn't
fabricate content or ship unverified marketing stats to production.

**Requires business approval:** confirm this cropped derivative is acceptable, or supply
a real photographed portrait of both partners to replace it.

---

## A2 — Contact page office tabs, remove in-form selector

**Reality check before implementing:** the form's office picker was already radio
buttons, not a `<select>` dropdown — that conversion must have happened in an earlier
pass. Implemented the brief's actual ask regardless: one tab per office, equal visual
weight, proper tab semantics, deep-linkable, no dropdown on mobile.

**Fix:** converted `ContactSection.tsx`'s office info display from an always-both-visible
dual column into a proper ARIA tabs pattern (`role="tablist"`/`"tab"`/`"tabpanel"`,
`aria-selected`, managed `tabIndex`, Left/Right/Home/End keyboard navigation). Removed
`ContactForm`'s independent radio-button fieldset — the tabs are now the single source
of truth for which office an enquiry targets, passed down as a controlled `officeId`
prop and reflected via a hidden field.

**Deep-linking:** added `?office=egypt` / `?office=kuwait` query-param support alongside
the existing `/contact/egypt` path segment (path wins if both present). Switching tabs
updates the URL via a shallow `router.replace`, no full navigation.

**Files touched:** `apps/public-site/src/app/contact/[[...office]]/page.tsx`,
`apps/public-site/src/features/contact/components/ContactSection.tsx` (+`.module.css`),
`apps/public-site/src/features/contact/components/ContactForm.tsx` (+`.module.css`).

**Verified functionally via Playwright:** default Egypt tab active with correct
`tabindex` management; clicking Kuwait switches `aria-selected`/URL/hidden-field
together; `?office=kuwait` deep-link opens the right tab on load; `ArrowRight` from the
first tab moves focus to and activates the second; both tabs remain visible (never
collapsing to a select) and clear the 44px touch-target floor at 320px with zero
horizontal overflow. Confirmed `/api/contact`'s existing `officeId`-to-email routing is
unaffected by the UI change (same string value, different control).

### Blocked

**`TODO_CONTACT_UAE`** — the brief names UAE as a third tab, but `offices.ts` has only
two real offices (Egypt, Kuwait). UAE is explicitly a future office with zero fields
populated in that file's own trailing comment. Rendering a third tab would mean
inventing an address, phone, and email — prohibited both by this brief's own "never
invent a contact value" rule and an explicit instruction earlier in this engagement.
No UAE tab rendered; UAE remains representable only as an `areaServed` value elsewhere
on the site, not a physical office.

---

## A3 — Remove all visible project numbering site-wide

Audited the whole codebase for the bug class described (`index + 1`, padded counters,
CSS `counter()`/`::before` content, numbers baked into labels) before touching anything.

**Found:** exactly one instance of real visible project numbering — the projects index
grid rendered each card's raw `p.id` ("01", "02"...) next to its title via an
`aria-hidden` span, which hides it from screen readers but **not** from sighted users
(`aria-hidden` has no effect on visual rendering). Removed it, plus the now-fully-dead
CSS that only styled it (`.ledgerRow .projectNumber` — itself already-unused dead code
from an abandoned list-view variant, cleaned up since it referenced the same removed
class).

**Explicitly did NOT touch**, after checking each one wasn't actually project numbering:
- `ItemList`/`BreadcrumbList` JSON-LD `position` fields — required, invisible
  structured-data properties. Removing them would violate "never remove existing SEO."
- The Lightbox/HeroSlider "image X of Y" counters and alt text — count photos within
  one project's gallery, not projects. Removing them would harm orientation and
  screen-reader accessibility for a concern the brief doesn't raise.
- Why-AHW's process-step numerals (01 Discovery, 02 Concept...) — an ordinal
  methodology list, not a project identifier standing in for a name.

**Files touched:** `apps/public-site/src/app/projects/page.tsx` (+`.module.css`).

**Verified:** at 320/768/1440px via the running dev server, confirmed no
`projectNumber` element renders on the projects grid; visually confirmed clean layout
(project titles, related-projects names, breadcrumbs all render by name only) on both
`/projects` and a project detail page's "Continue Exploring" section.

---

## A4 — UAE project page design inconsistency

**Root cause, stated before fixing (there was nothing to fix — see below):**
diagnosed by structurally comparing the UAE project page
(`khawaneej-courtyard-villa-dubai`) against a normal project
(`aurea-social-house-new-capital-egypt`) via the running dev server — not by reading
source and guessing. Both render through the **exact same** case-study template: the UAE
project has a fully-populated `caseStudy` object (brief, design, build, result,
narrative with `heroHeadline`/`story`/`designPhilosophy`/`whyDifferent`/
`clientExperience`/`faq`/`cta`/`seo` all present — actually one of the most complete
case studies in the dataset), so it takes the identical code branch as every other
project. A DOM-level comparison confirmed identical section class lists and heading
counts between the two pages.

**What actually caused the first, wrong impression of "inconsistency":** an initial
naive full-page screenshot (no deliberate scroll/wait) showed large blank gaps where
image sections should be — this was a **lazy-load timing artifact in the screenshot
method itself**, not a rendering bug. Re-captured with the page scrolled through
deliberately (400ms dwell per 700px, matching how a real visitor scrolls) and confirmed
zero images left unloaded on either page; the UAE page renders completely, richly, and
with the same section structure as every other project.

**The one genuine, real difference — content, not template:** this project's `design`
and `build` image sets are photorealistic AI-generated renders and architectural floor
plans, not real construction photography, because the project's actual, factual status
is `"Design Completed"` — it hasn't been built yet, so no real construction/result
photography exists. Every other project shown is mostly `"Completed"` status with real
photography. This is not a bug to fix in code: fabricating "completed" photography that
doesn't exist, or building a second template to visually hide this distinction, would
both violate this brief's own explicit rules ("never invent content," "do NOT create a
second template"). It's an accurate reflection of where the project actually stands.

**No code changes made for A4** — confirmed via direct investigation that no divergent
template/conditional branch/missing-data-fallback/different-component exists to fix.

**Requires business approval (informational only, not blocking):** if the visual
contrast between this project's renders/floor-plans and the rest of the portfolio's real
photography is undesirable, the options are (a) leave as-is and accept it as an
honestly-labeled in-progress project, or (b) hold this project off the public portfolio
until real construction photography exists. Both are content/business decisions, not
something to resolve by changing code.

---

## A5 — Image quality, weight, and download deterrence

**Quality — verified, not assumed, to already be correct.** A first pass of automated
weight capture appeared to show images served at `q=1`/`q=10` (alarmingly low) on the
Fintas project page — investigated before treating it as real, and it turned out to be a
bug in my own measurement script (`url.slice(0, 140)` truncated the URL mid-way through
`&q=100`, printing `q=10` or `q=1`). Re-captured with untruncated URLs: every project
image is served at `quality=100` consistently, matching `next.config.js`'s
`qualities: [100, 90, 75]` (explicitly widened from Next's 75 default in an earlier pass,
specifically to allow full-fidelity project photography) and the explicit `quality={100}`
props already set throughout `ImageMoments`/`HeroSlider`. No compression floor issue
exists — logged so this false alarm isn't repeated.

**Weight — already in good shape from earlier work, confirmed via measurement, not
touched further this pass** (current, not "before/after" — no compression or format
changes were made in A5, since none were needed):

| Route | Total image weight | Image count | Largest image |
|---|---|---|---|
| `/` (homepage) | 1,369 KB | 19 | 247 KB |
| `/projects` | 4,653 KB | 44 | 329 KB |
| `/projects/aurea-social-house-new-capital-egypt` | 1,369 KB | 9 | 396 KB |

AVIF is the delivered format for every project photo (confirmed via response
`content-type`), with WebP/original as automatic fallback through `next/image`. Explicit
`sizes` + `fill` inside aspect-ratio-controlled wrappers throughout (no CLS). Hero images
carry `priority`/`fetchPriority="high"`; everything below the fold is lazy. **Blur-up/LQIP
placeholders were not added** — Next's automatic `blurDataURL` generation only works for
statically-imported images, and this codebase references every project photo by string
path (hundreds of files across 20 projects); generating real per-image LQIP data would
need a new build-time script well beyond "minimum new files" for a perceived-speed gain
that's marginal given how small these already-optimized images are (single images
20–100KB, whole pages under 5MB). Logged as a **recommendation**, not implemented.

**Download deterrence implemented** (explicitly deterrents, not protection — any of this
is bypassable via DevTools, network inspection, or a screenshot, and the brief's own
framing says so plainly):
- `user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none`,
  `-webkit-user-drag: none` on every portfolio image (hero, in-page case-study images,
  Lightbox) — was already partially present (`user-select`, `-webkit-user-drag`) from an
  earlier pass; added the missing `-webkit-touch-callout: none` (blocks the iOS
  long-press "save image" callout, the one gap left on mobile).
- `draggable={false}` — already present on every project image before this pass.
- `onContextMenu={(e) => e.preventDefault()}` (right-click disable) — added to
  `HeroSlider.tsx` and `Lightbox.tsx`, both Client Components. **Real bug caught and
  fixed while implementing this:** first attempt also added it to the case-study body
  images in `projects/[slug]/page.tsx`'s `ImageMoments` — that file is a Server
  Component (no `'use client'`), and passing an inline function as a prop from a Server
  Component crashed the entire page ("Event handlers cannot be passed to Client
  Component props"), confirmed via a real page-load check showing a collapsed
  `scrollHeight` (1289px vs. the correct ~8500px) and the exact React error in the
  console. Reverted that specific change immediately; those images keep the CSS- and
  `draggable`-based deterrence (still real, just not the `onContextMenu` layer) rather
  than force a Server/Client boundary restructure to add one more deterrent layer —
  restructuring the page's component boundary is exactly the kind of change Stage A's
  "addition, not transformation" rule rules out. Re-verified the page renders correctly
  (13 images, full ~8500px scroll height, zero page errors) after reverting.
- **Originals remain directly fetchable at their plain `/ahw-projects-assets/...` path**
  (confirmed via `curl`, HTTP 200) even though the site's own UI always requests the
  `next/image`-optimized version — this is inherent to Next.js's `public/` static-file
  serving model and cannot be closed without moving every project image out of `public/`
  into a protected, server-only store served exclusively through an authenticated API
  (the exact "storage served under authentication" pattern Stage C's Client Portal
  introduces for portal-only files). Doing that for the *public marketing* site's own
  portfolio would be a genuine architecture change, not an addition — out of scope for
  Stage A. Logged as a known, honest limitation, not silently left unstated.
- **`Cache-Control: no-store` — considered, not implemented.** It wouldn't meaningfully
  deter a determined visitor (DevTools/network-tab saves work regardless of cache
  headers) but would cost every repeat visitor a full re-download of every portfolio
  image, directly working against the performance budget this whole engagement has
  treated as a hard priority. A deterrent that isn't protective shouldn't be paid for
  with real performance. Not implemented; logged as a considered-and-rejected option
  with reasoning, not a silent skip.
- **Watermarking — logged as a recommendation only, per explicit instruction, not
  implemented.** A subtle corner watermark is the only measure in this list that would
  survive a screenshot (nothing else does), but it's a brand/visual decision on
  the client's own photography, not something to apply unilaterally. Needs approval.

**Files touched:** `packages/ui-components/src/components/gallery/Lightbox.tsx`
(+`.module.css`), `packages/ui-components/src/components/animations/HeroSlider.tsx`
(+`.module.css`), `apps/public-site/src/app/projects/[slug]/page.module.css`.

**Verified functionally via Playwright, not just read from source:** dispatched a real
`contextmenu` event against the Lightbox's rendered image and confirmed
`event.defaultPrevented === true`, `draggable="false"`, and `user-select: none` all hold
on the actual DOM after opening the lightbox from the hero image.

**Requires business approval:** watermarking (see above) and the direct-original-path
limitation (accept as-is for the public site, or scope a future authenticated-storage
migration for portfolio images specifically).

---

## A6 — /insights/news launch-readiness (standalone, zero social integration)

**Routing:** `/insights/news` returns 200 and renders correctly. `newsItems` is currently
an empty array (`packages/ui-components/src/data/news.ts` — `export const newsItems:
NewsItem[] = []`), so the page is showing its real, correct empty state, not a bug.

**Metadata:** title (`News | AHW Architects`), canonical, and OpenGraph all present and
correct on the listing page; the `[slug]` detail route's `generateMetadata` correctly
falls back to `{ title: 'Not Found' }` when a slug doesn't resolve.

**Structured data:** `CollectionPage` with `hasPart: []` on the listing (valid schema for
an empty collection, not a parse error — confirmed by actually parsing the emitted
JSON-LD, not assuming). Individual articles use `NewsArticle` (the more specific,
accurate type for news content, not a generic `Article`) — correct as implemented, though
unverifiable against a real article until real news items exist.

**Listing / filter bar:** `InsightsFilterBar` renders gracefully with zero tags (just the
"All" pill, no broken empty-list rendering, zero console errors).

**Empty state:** "No news found matching your criteria." renders correctly when the
filtered list is empty (currently always, since the dataset is empty).

**Pagination:** no pagination mechanism exists in this section. Not a bug against a
0-item dataset — nothing to paginate — but also not something to build speculatively
against data that doesn't exist yet ("never invent content" extends to not inventing
scaffolding for content that isn't there). Logged under Blocked/Requires-approval below
for whoever adds the first real news items.

### Real bug found and fixed while checking "routing" — site-wide, not scoped to news

Checking `/insights/news/[bad-slug]` turned up a genuine, confirmed, site-wide defect:
**every dynamic detail route calling `notFound()` for an unknown slug was returning HTTP
200, not 404** — a "soft 404," which search engines treat as a real quality problem
(indexable, but content-free, pages) and which breaks any tooling that relies on status
codes to detect broken links.

**Investigated properly before fixing, not guessed at:** ruled out `curl`-specific
behavior (reproduced identically through an actual Playwright browser context), ruled
out dev-mode-only quirks (reproduced against a clean production build, not just `next
dev`), ruled out `middleware.ts` (none exists), ruled out `next.config.js`'s
`redirects()` array (none of its 19 entries match the test slugs, and the bug reproduced
on routes — `/insights/news/[slug]`, `/insights/publications/[slug]` — with zero related
redirect entries), ruled out a try/catch swallowing the `notFound()` control-flow error
(none exists in these page components). Confirmed a genuinely unmatched route (no
pattern match at all) returns a correct 404, isolating the bug specifically to
in-component `notFound()` calls on matched dynamic routes.

**Root cause, confirmed via web search against a documented Next.js App Router issue:**
`notFound()` doesn't set a 404 status if a Suspense boundary already started streaming
the response as 200 before the check runs — and a `loading.tsx` file at or above a route
segment automatically wraps it in exactly that kind of Suspense boundary.
`projects/[slug]/loading.tsx`, `insights/news/[slug]/loading.tsx`, and
`insights/publications/[slug]/loading.tsx` all existed and all matched this exact trigger
condition.

**Fix:** removed all three `loading.tsx` files. Checked first that this was safe to do,
not just convenient: every one of these routes' only `await` is `await params` (Next's
own params Promise, resolves immediately) — `projects.find()` / `newsItems.find()` /
`publications.find()` are synchronous in-memory array lookups against build-time static
data, so the loading skeleton these files rendered had no real latency to ever cover in
practice. `projects/[slug]` additionally uses `generateStaticParams()` and still returned
200 for an unlisted slug even after removing its own `loading.tsx` (the parent
`/projects/loading.tsx` still wraps it in a Suspense boundary) — fixed properly, not
worked around, by adding `export const dynamicParams = false`: since `projects.ts` is
static build-time data with every valid slug already enumerated, there is no legitimate
case for a slug outside that list to be valid, so rejecting it at the routing layer
(before the page component or any Suspense boundary is even reached) is the more
correct behavior anyway, not just a status-code patch. Left `/projects/loading.tsx` and
`/contact/loading.tsx` untouched — neither calls `notFound()`, so neither is affected by
this bug class.

**Files touched:** removed `apps/public-site/src/app/projects/[slug]/loading.tsx`,
`apps/public-site/src/app/insights/news/[slug]/loading.tsx`,
`apps/public-site/src/app/insights/publications/[slug]/loading.tsx`; added
`export const dynamicParams = false` to `apps/public-site/src/app/projects/[slug]/page.tsx`.

**Verified against a clean production build** (`next build` + `next start`, not dev
mode — this bug's status-code behavior needed the real production streaming path, not
dev-mode's different one): `/projects/nonexistent-project-slug`,
`/insights/news/nonexistent-slug`, and `/insights/publications/nonexistent-slug` all now
return 404 (confirmed via both `curl` and a real Playwright browser context, showing the
correct `not-found.tsx` content — "This page hasn't been designed yet."). Confirmed real
pages are unaffected: `/projects/aurea-social-house-new-capital-egypt` still returns 200
with the correct title, `/insights/news` listing still returns 200. `tsc --noEmit` and
`eslint .` both clean after the change.

### Blocked / Requires business approval

**Pagination for /insights/news** — not built, since there's no content to paginate yet
and building it speculatively risks guessing wrong about volume/UX before real news posts
exist. Recommend adding this as part of whatever workflow first populates `newsItems`
(Stage C's admin panel is the natural place, since it will be the thing creating these
entries going forward).

---

## A7 — Stage A verification

**Clean production build:** `rm -rf apps/public-site/.next && corepack pnpm --filter
public-site build` — zero build, lint, or type errors. 45 routes generated. Re-run twice
more during A6/A7 as fixes landed; clean every time.

**Local production preview:** `corepack pnpm --filter public-site exec next start -p
3005`, served at **http://localhost:3005**.

**Site-wide sweep (43 routes, crawled from every seed page to discover every internal URL
actually linked site-wide):** HTTP status, console errors, failed sub-resource requests,
`<h1>` count, canonical/OG presence, JSON-LD parse validity, missing/empty `alt` count,
and heading-level order, run against the live production server. First pass found one
real regression introduced by A2 (see below); zero findings on the re-run after the fix.
Every route: 200, one `<h1>`, zero broken images, zero missing alt text, zero JSON-LD
parse errors. Only non-blocking finding on every route: the pre-existing Tawk.to
localhost CORS artifact (documented repeatedly earlier in this engagement — resolves
itself once the real production domain is registered with Tawk.to; not a code defect).

**Regression caught and fixed:** the sweep flagged a heading-order violation on
`/contact`, `/contact/egypt`, `/contact/kuwait` — introduced by A2's conversion to tabs.
The old dual-column layout had `<h2>` office-name headings; moving the office name into
the tab button (correctly — tab labels aren't headings) left the page jumping from `<h1>`
straight to the office detail panel's `<h3>` labels (Address/Contact/Working Hours) with
no `<h2>` in between. Bumped those three labels from `<h3>` to `<h2>`, since they're now
the first real subsections after the page's own `<h1>`. Re-ran the full sweep: clean.

**Responsive sweep:** 14 representative routes (covering every page type — homepage,
projects index and a filtered view, two project detail pages of different tiers, the new
contact tabs at both the default and a deep-linked tab, expertise, about, both about-us
and its parent, both insights sections, faq, the capability statement) × 6 breakpoints
(320/375/768/1024/1440/1920px) = 84 combinations. **Zero horizontal overflow findings**
at any combination, including 320px.

**Office Parity Rule re-verified visually** after A2's tab conversion, not just assumed
from the functional check in A2 itself: screenshotted both the Egypt and GCC/Kuwait tabs
in their active state — identical font size, weight, and position for both, only the
active-state underline/color differs (the correct way to signal selection without
implying either office is more important).

**All internal links resolve:** confirmed structurally by the 43-route crawl-and-visit
sweep — any link pointing at a broken destination would surface as that destination's
own `httpStatus >= 400` in the results; none did.

**AUDIT.md / RC-REPORT.md regression check:** the full AUDIT.md acceptance table was
already re-verified item-by-item in RC-REPORT.md's own Section 7 earlier in this
engagement. Re-checked the specific items this Stage A pass could plausibly have
disturbed: D9 (keyboard accordion nav) and D11 (`/expertise` `<h1>`) are both untouched
by any Stage A change and remain covered by this sweep's own `h1Count`/heading-order
checks. The Office Parity Rule (established and verified repeatedly throughout this
engagement) was the one genuinely at risk from A2's rework and is re-verified above.

**Stage A complete.** Continuing immediately to Stage B per the brief's own instruction
not to pause for approval between stages.
