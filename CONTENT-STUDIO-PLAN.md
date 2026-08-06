# Content Studio — Architecture Plan

Status: **proposed, not yet implemented.** Nothing in this document has been built.
Per your instruction, implementation does not start until this plan is approved.

This is a companion to `/PORTAL-PLAN.md` (which this extends, not replaces) and
`/PORTAL-IMPLEMENTATION.md` (which documents what's already live). Read those two
first if you need the full picture of what already exists — this document only
covers the new Content Studio phase and the product-boundary decision that now
governs it.

---

## 0. Product boundary: Website vs. future ERP

This is the governing rule for every section below, not just a preface.

**The website owns:** public site, portfolio, insights/news, careers, SEO, the
Client Portal, brand presence, marketing, and social publishing — everything in
this document.

**The future ERP owns:** CRM, leads, quotations, procurement, suppliers, HR,
accounting, inventory, internal operations, business intelligence. **None of that
gets built here, ever, starting now.** Where a Content Studio feature brushes up
against ERP territory (this happens twice — lead attribution and analytics — both
flagged explicitly in their own sections), the website's job is to **capture and
expose the raw signal**, not to own the business process built on top of it.

The two products talk through a **narrow, versioned API boundary**, not a shared
database and not direct table access in either direction. Section 11 designs that
boundary concretely, using a pattern already present in this codebase
(`packages/application`'s port interfaces — `ObjectStoragePort`, `EmailPort`,
`EventBusPort`, etc.) rather than inventing a new integration style. The practical
upshot: when the ERP exists, it will call a handful of `/api/erp/*` endpoints and
optionally receive webhook-style events from a domain-event outbox this plan adds
now (Section 11.2) — the website is never blocked waiting for the ERP to exist, and
the ERP is never blocked waiting for the website to change.

---

## 1. Existing architecture this builds on

Nothing here is a restatement for its own sake — every choice below either reuses
or deliberately extends one of these, and each is named because Section 4+ refers
back to it.

- **`NewsPost` / `SocialPost`** (Prisma models, `apps/public-site/prisma/schema.prisma`)
  — the publishing pipeline built in Stage C4/D. Content Studio's News System
  (Section 2.1) extends `NewsPost` with the fields a real editorial workflow needs;
  it does not replace the model or the publish/schedule/social-package flow already
  working end-to-end.
- **The social adapter pattern** (`lib/portal/social/{types,adapter,instagram,
  facebook,linkedin,dispatch}.ts`) — one file per platform behind an `isConfigured()`
  flag+credentials check, Manual mode by default, `formatContent()`/`publish()`
  per adapter. Google Business Profile (Section 6) is a **new adapter in this exact
  same shape**, not a new pattern.
- **`lib/portal/storage.ts` + `lib/portal/signed-url.ts`** — local-filesystem object
  storage with HMAC-signed, short-lived, scope-prefixed download tokens
  (`doc:`/`photo:`). The Media Library (Section 3) reuses this storage layer for
  originals and adds a third scope (`media:`) rather than building a second storage
  system.
- **`packages/application`'s port interfaces** — already-defined, currently
  unimplemented contracts (`ObjectStoragePort`, `EmailPort`, `EventBusPort`,
  `AuditPort`, `CachePort`, `MonitoringPort`, `SearchPort`, `IdentityPort`). Section
  11 adds the ERP-facing ports to this same package, in the same style.
- **`packages/design-tokens`** — the actual brand: a deep, monochromatic palette
  (`--color-brand-ink #0F1115`, `--color-brand-paper #F2F4F7`, `--color-brand-stone
  #8B929A`, `--color-brand-accent` — white on dark, black on light), Inter (body) +
  Outfit (display) typography, oversized architectural type scale. This is the
  literal visual identity the template engine (Section 5) has to reproduce — not a
  generic "brand colors" placeholder.
- **Admin Panel patterns** (`app/admin/**`, `lib/portal/actions/*.ts`) — Server
  Actions calling `requireSession()`/`requireRole()` independently of the page,
  `ActionForm` as the one generic form wrapper, `portal-ui.module.css` as the one
  shared style sheet. Content Studio's admin UI (Media Library, Template picker,
  expanded News editor) is built the same way — no new UI framework, no new form
  pattern.
- **`PORTAL_ENABLED` gating** — Content Studio's admin surfaces live under `/admin`,
  which is already reachable by SUPER_ADMIN regardless of the flag. No new gating
  mechanism is needed; the News System's *public* output already goes live
  immediately on publish (Stage C4's `getPublicNewsItems()` merge), which is exactly
  the behavior Content Studio needs too.

---

## 2. Content Studio scope

Four pillars, plus two features that ride on top of them:

1. **News System** (Section 2.1) — the editorial content model: categories, tags,
   featured image + gallery, SEO/OG fields, full AI content package per post.
2. **Media Library** (Section 3) — a real DAM. Every image is a reusable asset with
   metadata, not a file glued to one post.
3. **Social Template Engine** (Section 5) — ~10 branded graphic templates, one
   click from "pick an image" to "here are 7 platform-ready files."
4. **AI Content Package** (Section 7) — one click generates SEO title, meta
   description, alt text, caption, hashtags, keywords, and a suggested CTA.

Riding on top:

5. **Google Business Profile** (Section 6) — a first-class publishing destination,
   built as a fifth social adapter.
6. **Analytics** (Section 10) — a marketing dashboard, with the CRM-boundary
   question (lead sources, conversion) resolved explicitly rather than glossed over.

### 2.1 News System — what "complete" means here

Every article gets:

| Field group | Fields | Notes |
|---|---|---|
| Core | title, slug, excerpt, body | Already exist. |
| Media | featuredImage, gallery | New — both reference `MediaAsset` (Section 3), not raw uploads. A post never owns its own image file; it references library assets. |
| Taxonomy | categories, tags | New — see Section 4.2 for the shared taxonomy design (categories and tags are reused by Media Library assets too, not duplicated per content type). |
| SEO | metaTitle, metaDescription, canonicalUrl | New — falls back to title/excerpt if unset, never blocks publishing on missing SEO fields. |
| Open Graph | ogTitle, ogDescription, ogImage | New — falls back to the featured image + SEO fields; only needs explicit values when you want OG to say something different from the page itself (common for social-specific framing). |
| Social package | existing `SocialPost` rows + AI-suggested hashtags/caption (Section 7) | Extends what's already built, doesn't replace it. |

---

## 3. Media Library (Digital Asset Manager)

### 3.1 What changes

Today, a `Photo` or `Document` row belongs to exactly one `Project`, uploaded
through that project's admin page, and that's correct for client-facing
construction photos and contracts — **that system is not changing.** The Media
Library is a **separate, new** asset pool for marketing/editorial imagery
(portfolio hero shots, lifestyle photography, headshots, anything reused across
multiple posts, templates, or pages) — a new `MediaAsset` model, not a
repurposing of `Photo`.

### 3.2 Metadata per asset

| Field | Type | Purpose |
|---|---|---|
| project | optional relation to `Project` | Which project this image depicts, if any (a marketing shot of a completed project, not the client's private progress photos). |
| service | optional enum/relation | Which service line (Architecture / Interior Design / Design-Build / Fit-Out) — matches the site's existing `/expertise/*` structure. |
| category, tags | relations to shared `Category`/`Tag` tables (Section 4.2) | Same taxonomy as News. |
| photographer | string, optional | Attribution. |
| copyright | string, optional | e.g. "© AHW Architects 2026" — needed before any asset can be reused publicly with confidence. |
| keywords | string[] | Manually entered, searchable. |
| aiTags | string[] | Machine-generated (Section 7.3) — kept separate from manual `keywords` so a bad AI guess never overwrites a human's deliberate tagging, and so the UI can visually distinguish "you said" from "the AI guessed." |
| orientation | enum: LANDSCAPE / PORTRAIT / SQUARE | Derived automatically from the uploaded file's dimensions at ingest — never asked of the uploader. |
| dominantColors | string[] (hex) | Derived automatically (Section 3.4). |
| width, height, fileSize, mimeType | derived at ingest | Standard. |
| uploadedById, uploadedAt | | Standard. |
| storageKey | string | The **original** file's location (see 3.3 — variants are separate rows, not fields, because a variant has its own dimensions/purpose and needs to be independently queryable, e.g. "give me every 1080×1350 crop generated from this asset"). |

### 3.3 Originals vs. variants

An asset has exactly one original (as uploaded) and zero or more **generated
variants** (each variant = one aspect-ratio/purpose combination, produced by the
smart-cropping pipeline in 3.4 or the template engine in Section 5). Variants are
their own table (`MediaAssetVariant`), not JSON blobs on the asset row, because:

- they need independent signed-download-URL support (same `verifyAssetToken`
  pattern as documents/photos, new `media:` scope) — a template render references a
  *specific* variant, not "the asset, cropped somehow at request time";
  regenerating deterministically at request time would mean two different template
  renders of "the same" asset could silently differ if the cropping algorithm
  changes later.
- a variant can be regenerated (better crop, new template output) without touching
  the original or losing history of what shipped where.

### 3.4 Ingest pipeline

1. Upload arrives (multipart, same `uploadDocument`/`uploadPhoto` Server Action
   pattern already established) — content-type sniffed from real bytes via
   `file-type` (already a dependency), rejected if not an allowed image format.
2. `sharp` reads dimensions → `orientation` derived (landscape/portrait/square by
   aspect ratio, not just width>height, so a 1.02:1 image still reads as square).
3. **Dominant colors**: `sharp .resize(8, 8, { fit: 'inside' }).raw()` sampled down
   to a handful of pixels, reduced to the 3–5 most common quantized hex values.
   This is an approximation (a proper k-means clustering library would be more
   accurate) — named explicitly as a v1 trade-off; if the approximation proves
   visibly wrong in practice, swapping in a small clustering library later is an
   isolated change to one function, not an architecture change.
4. **AI tags**: deferred to the same on-demand AI pipeline as the content package
   (Section 7) — not generated automatically on every upload (cost + the
   unconfigured-by-default reality mean this has to be an explicit action, "Generate
   AI tags," not a silent background step that fails invisibly when no API key is
   set).
5. Original saved via the existing `saveFile()` storage abstraction under a new
   `media/` key prefix.
6. **No variants are generated at upload time.** Variants are generated on demand —
   either by the smart-cropping "give me this asset at these aspect ratios" action
   (3.5) or as a side effect of running it through the template engine (Section 5).
   Generating all possible variants speculatively at upload time would waste storage
   and compute on aspect ratios that specific asset never actually needs.

### 3.5 Smart cropping

When a variant at a new aspect ratio is requested, `sharp`'s attention-based
cropping does the actual work:

```
sharp(original)
  .resize({
    width, height,           // target dimensions for that platform/purpose
    fit: 'cover',
    position: sharp.strategy.attention,  // entropy/attention-based, not naive center-crop
  })
```

`sharp.strategy.attention` crops toward the region of the image with the most
visual "energy" (edges, contrast, saliency) — in practice, for architectural
photography, this reliably keeps a building's facade or a room's focal point in
frame rather than cropping into a plain sky or wall. It is **not** semantic
(it doesn't know "this is a building" specifically) — for the small number of hero
assets where automatic cropping gets it wrong, the Media Library UI includes a
manual crop-region override per variant (drag-to-adjust, stored as the crop
rectangle used instead of the automatic one on regeneration). This is the
"protect important architectural elements, avoid cropping buildings awkwardly"
requirement: automatic by default, correctable by a human without needing a
different tool.

---

## 4. Database schema changes

All additive — no existing model is altered in a breaking way, no existing data
migrates. Every new model follows the existing schema's conventions (cuid ids,
`createdAt`/`updatedAt`, explicit `@@index` on foreign keys).

### 4.1 Media Library

```prisma
enum AssetOrientation {
  LANDSCAPE
  PORTRAIT
  SQUARE
}

model MediaAsset {
  id              String            @id @default(cuid())
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  storageKey      String
  fileName        String
  fileType        String
  fileSize        Int
  width           Int
  height          Int
  orientation     AssetOrientation
  dominantColors  String[]
  keywords        String[]
  aiTags          String[]
  photographer    String?
  copyright       String?
  projectId       String?
  project         Project?          @relation(fields: [projectId], references: [id])
  service         ServiceLine?
  categories      MediaAssetCategory[]
  tags            MediaAssetTag[]
  variants        MediaAssetVariant[]
  uploadedById    String
  uploadedBy      User              @relation(fields: [uploadedById], references: [id])

  @@index([orientation])
  @@index([projectId])
}

enum ServiceLine {
  ARCHITECTURE
  INTERIOR_DESIGN
  DESIGN_BUILD
  FIT_OUT
}

// Purpose is a free label ("instagram-portrait", "og-image", "hero-1920") rather
// than a closed enum — the template engine (Section 5) and future output targets
// both write into this table, and a closed enum would need a migration every time
// a new platform or crop is added.
model MediaAssetVariant {
  id          String     @id @default(cuid())
  createdAt   DateTime   @default(now())
  assetId     String
  asset       MediaAsset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  purpose     String
  storageKey  String
  width       Int
  height      Int
  cropRegion  Json?      // manual override, if one was set; null = automatic

  @@unique([assetId, purpose])
  @@index([assetId])
}
```

### 4.2 Shared taxonomy (Categories & Tags)

Shared between `NewsPost` and `MediaAsset` deliberately — a "Luxury Residential"
category or a "before-after" tag means the same thing whether it's on an article or
an image, and sharing the table is what makes a future "everything tagged
before-after" browse view possible without a UNION across two separate taxonomies.

```prisma
model Category {
  id        String              @id @default(cuid())
  name      String              @unique
  slug      String              @unique
  newsPosts NewsPostCategory[]
  mediaAssets MediaAssetCategory[]
}

model Tag {
  id        String        @id @default(cuid())
  name      String        @unique
  slug      String        @unique
  newsPosts NewsPostTag[]
  mediaAssets MediaAssetTag[]
}

// Explicit join tables (not implicit m:n) — same reasoning the schema already
// applies to ProjectMember: room for per-relation metadata later (e.g. a
// "primary category" flag) without a migration, and Prisma's implicit m:n
// tables are harder to query directly when you need to.
model NewsPostCategory {
  newsPostId String
  newsPost   NewsPost @relation(fields: [newsPostId], references: [id], onDelete: Cascade)
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([newsPostId, categoryId])
}

model NewsPostTag {
  newsPostId String
  newsPost   NewsPost @relation(fields: [newsPostId], references: [id], onDelete: Cascade)
  tagId      String
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([newsPostId, tagId])
}

model MediaAssetCategory {
  mediaAssetId String
  mediaAsset   MediaAsset @relation(fields: [mediaAssetId], references: [id], onDelete: Cascade)
  categoryId   String
  category     Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([mediaAssetId, categoryId])
}

model MediaAssetTag {
  mediaAssetId String
  mediaAsset   MediaAsset @relation(fields: [mediaAssetId], references: [id], onDelete: Cascade)
  tagId        String
  tag          Tag        @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([mediaAssetId, tagId])
}
```

### 4.3 `NewsPost` extensions

```prisma
model NewsPost {
  // ...existing fields unchanged...

  featuredImageId   String?
  featuredImage     MediaAsset?        @relation("FeaturedImage", fields: [featuredImageId], references: [id])
  gallery           NewsPostGalleryImage[]
  categories        NewsPostCategory[]
  tags              NewsPostTag[]

  metaTitle         String?
  metaDescription   String?
  canonicalUrl      String?
  ogTitle           String?
  ogDescription     String?
  ogImageId         String?
  ogImage           MediaAsset?        @relation("OgImage", fields: [ogImageId], references: [id])

  // AI Content Package (Section 7) — kept as direct fields, not a separate
  // versioned table, as a deliberate v1 scope decision: regeneration simply
  // overwrites. If "show me what the AI suggested last time before I
  // regenerated" becomes a real need, promoting these to an
  // AIContentSuggestion history table is an additive migration, not a rewrite.
  aiSeoTitle        String?
  aiMetaDescription String?
  aiSuggestedHashtags String[]
  aiSuggestedKeywords String[]
  aiSuggestedCta    String?
}

model NewsPostGalleryImage {
  id         String     @id @default(cuid())
  newsPostId String
  newsPost   NewsPost   @relation(fields: [newsPostId], references: [id], onDelete: Cascade)
  assetId    String
  asset      MediaAsset @relation(fields: [assetId], references: [id])
  sortOrder  Int        @default(0)

  @@index([newsPostId])
}
```

### 4.4 Social Template Engine

```prisma
model SocialTemplate {
  id           String   @id @default(cuid())
  name         String                     // "Luxury Architecture", "Before / After", etc.
  category     String                     // groups the ~10 launch templates for the picker UI
  componentKey String   @unique           // maps to a React component in the template registry (Section 5.2) — not stored as serialized JSX
  previewImage String?                    // storageKey of a rendered example, shown in the template picker
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
}

// One row per generated graphic — links the source asset, the template used,
// and every platform-sized output produced from that one generation action.
model GeneratedGraphic {
  id          String                    @id @default(cuid())
  createdAt   DateTime                  @default(now())
  templateId  String
  template    SocialTemplate            @relation(fields: [templateId], references: [id])
  sourceAssetId String
  sourceAsset MediaAsset                @relation(fields: [sourceAssetId], references: [id])
  newsPostId  String?
  newsPost    NewsPost?                 @relation(fields: [newsPostId], references: [id])
  projectName String?                   // text baked into the template at generation time
  serviceName String?
  createdById String
  createdBy   User                      @relation(fields: [createdById], references: [id])
  outputs     GeneratedGraphicOutput[]

  @@index([newsPostId])
}

model GeneratedGraphicOutput {
  id                 String           @id @default(cuid())
  generatedGraphicId String
  generatedGraphic   GeneratedGraphic @relation(fields: [generatedGraphicId], references: [id], onDelete: Cascade)
  purpose            String           // "instagram-portrait" | "instagram-square" | "facebook" | "linkedin" | "og" | "thumbnail" | "hero"
  storageKey         String
  width              Int
  height             Int

  @@unique([generatedGraphicId, purpose])
}
```

### 4.5 Google Business Profile

Extends the *existing* `SocialPlatform` enum and `SocialPost` table rather than
building a parallel system — see Section 6 for why this is safe (the shape genuinely
fits) and where it doesn't (three GBP-only nullable fields, not a schema fork).

```prisma
enum SocialPlatform {
  INSTAGRAM
  FACEBOOK
  LINKEDIN
  GOOGLE_BUSINESS   // new
}

model SocialPost {
  // ...existing fields unchanged...
  gbpTopicType    String?   // "STANDARD" for v1 (see 6.3) — nullable, only set for GOOGLE_BUSINESS rows
  gbpCtaType      String?   // e.g. "LEARN_MORE" — nullable
  gbpCtaUrl       String?   // nullable
}
```

### 4.6 Analytics (self-hosted internal metrics)

See Section 10 for the full split between this (self-hosted, works immediately)
and the GA4-sourced side (external, gated behind real API credentials, same
manual-mode-by-default pattern as social).

```prisma
model PageView {
  id         String   @id @default(cuid())
  occurredAt DateTime @default(now())
  path       String
  entityType String?  // "Project" | "NewsPost" | null for generic pages
  entityId   String?
  referrer   String?
  utmSource  String?
  utmMedium  String?
  utmCampaign String?

  @@index([path])
  @@index([entityType, entityId])
  @@index([occurredAt])
}
```

### 4.7 Lead attribution (website-side capture only — see Section 11.1 for the ERP boundary)

```prisma
model Enquiry {
  // ...existing fields unchanged...
  referrer    String?
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  landingPath String?   // first page the visitor hit before converting
}
```

---

## 5. Social Template Engine architecture

### 5.1 Rendering approach: `next/og`, not a headless browser

Next.js 16 (already the framework in use) ships `ImageResponse` (`next/og`), which
renders JSX → SVG (via Satori) → PNG (via `resvg`) **without launching a browser** —
this is the same primitive Next.js's own `opengraph-image.tsx` file convention uses
internally. This is the correct fit here for three concrete reasons:

- **Zero new heavy runtime dependency.** No Playwright/Puppeteer/Chromium in
  production — that stack is exactly what this session deliberately kept out of
  `package.json` (used only as a temporary, removed-after-use devDependency for
  *testing*, never a runtime dependency). A template engine that required a headless
  browser at request time would be a materially heavier, harder-to-deploy system.
- **Serverless/edge-friendly.** `ImageResponse` is designed to run in constrained
  runtimes; it doesn't need a persistent browser process.
- **Deterministic, fast, and already proven at this exact task** — this is
  literally what OG-image generation is for; using it for branded social graphics
  is the same technique aimed at a bigger set of outputs.

**Known constraints this section designs around:**

- Satori's CSS support is a real subset (flexbox layout, no CSS custom properties,
  limited selectors) — brand tokens must be plain JS values, not `var(--...)`
  (Section 5.4).
- Fonts must be supplied as raw font-file bytes (ArrayBuffer), not `font-family`
  names resolved from the OS/browser — Section 5.5.
- Image `src` values must be data URIs or fetchable URLs, not arbitrary local file
  paths — the media pipeline already produces signed URLs for exactly this reason.

### 5.2 Template registry

Each of the ~10 templates is a plain React component — a pure function of props to
JSX, no client-side interactivity, living in a new
`apps/public-site/src/lib/content-studio/templates/` directory (one file per
template) and registered by `componentKey` (matching `SocialTemplate.componentKey`
in the DB) in a single `registry.ts`:

```ts
// lib/content-studio/templates/registry.ts
export const TEMPLATE_REGISTRY: Record<string, TemplateComponent> = {
  'luxury-architecture': LuxuryArchitectureTemplate,
  'interior-design': InteriorDesignTemplate,
  'construction-progress': ConstructionProgressTemplate,
  'before-after': BeforeAfterTemplate,
  'project-milestone': ProjectMilestoneTemplate,
  'case-study': CaseStudyTemplate,
  'company-announcement': CompanyAnnouncementTemplate,
  'design-insight': DesignInsightTemplate,
  'client-testimonial': ClientTestimonialTemplate,
  'minimal-editorial': MinimalEditorialTemplate,
};
```

Every template receives the same prop shape:

```ts
interface TemplateProps {
  imageUrl: string;           // signed URL or data URI of the source asset/variant
  projectName?: string;
  serviceName?: string;
  headline?: string;          // e.g. post title, testimonial quote, milestone name
  logoSrc: string;             // resolved once, not per-template
  brand: BrandTokens;          // Section 5.4
}
```

— so "choose template → choose image → generate" (the required user flow) is
literally: look up the component by key, pass it the asset's URL plus whatever text
fields that template needs, render at each required output size.

### 5.3 Required outputs and dimensions

Generated automatically, every time, no manual resizing:

| Purpose | Dimensions | Aspect | Notes |
|---|---|---|---|
| Instagram Portrait | 1080 × 1350 | 4:5 | Instagram's current max-engagement feed format. |
| Instagram Square | 1080 × 1080 | 1:1 | |
| Facebook | 1200 × 630 | 1.91:1 | Matches Facebook's link-preview card size. |
| LinkedIn | 1200 × 627 | ~1.91:1 | Effectively identical to Facebook/OG — one render, reused, not a separate template pass. |
| Open Graph | 1200 × 630 | 1.91:1 | Same render as Facebook — `NewsPost.ogImage` can point straight at this output. |
| Website Thumbnail | *(confirm against `NewsCard`/`PublicationCard` in `packages/ui-components` at implementation time)* | — | Not guessing a number here; the real component's rendered aspect ratio is the source of truth and takes five minutes to check when this is actually built. |
| Hero Banner | *(confirm against `HeroSlider`'s existing convention)* | — | Same reasoning. |

Each output is one `GeneratedGraphicOutput` row; Facebook/LinkedIn/OG being
pixel-identical means the pipeline renders that size once and writes it under all
three `purpose` values rather than rendering the same JSX three times.

### 5.4 Brand tokens for Satori

Satori can't read `packages/design-tokens`' CSS custom properties directly, so a
small, explicitly-synced module duplicates the *values* as plain constants:

```ts
// lib/content-studio/brand-tokens.ts
// Kept in sync by hand with packages/design-tokens/src/styles/tokens.css —
// Satori has no CSS custom-property support, so these can't be var()
// references. If design-tokens.css changes, this file needs a matching edit;
// flagged here so that dependency isn't invisible.
export const BRAND_TOKENS = {
  ink: '#0F1115',
  paper: '#F2F4F7',
  stone: '#8B929A',
  accentDark: '#FFFFFF',
  accentLight: '#000000',
} as const;
```

Reflecting the real brand (monochromatic, editorial, dark-forward) rather than
generic "brand colors": templates default to ink backgrounds with paper type,
minimal color, oversized Outfit display type for headlines and Inter for
supporting text — matching what's already on the site, not a new visual language
invented for social media.

### 5.5 Fonts and logo assets

- **Fonts**: `next/font`'s compiled output isn't reusable as raw bytes for Satori.
  Vendor the specific weights actually used (Inter Regular + SemiBold, Outfit Light
  + Medium — matching `--font-weight-light`/`--font-weight-medium` already defined
  in tokens.css) as static `.ttf` files under
  `lib/content-studio/fonts/`, sourced once from Google Fonts and checked into the
  repo (a few hundred KB total) — deterministic, no network fetch at render time.
- **Logo**: existing assets are WEBP (`logo-dark.webp`/`logo-white.webp`); Satori's
  image handling is most reliable with PNG/JPEG. One-time export to PNG for
  template-engine use — not a new logo, not a design change.

### 5.6 Every template automatically places

Per the requirement — these are layout-level guarantees in the shared template
props/component structure, not something a user configures per-generation:

Logo · Typography (Inter/Outfit per the real scale) · Brand colors (ink/paper/
stone/accent) · a legibility overlay (gradient scrim behind text, standard
technique for text-over-photo) · website URL · a CTA string · project name ·
service name — each template lays these out differently (that's what makes them
different templates), but every template's component signature includes all of
them so none can be silently forgotten in a new template.

### 5.7 User flow

```
Admin → Media Library → pick an asset (or Admin → News post → pick from gallery)
      → "Generate social graphics"
      → choose a template (grid of ~10, previewImage shown)
      → confirm/edit the auto-filled project name, service, headline
      → Generate
      → all 5–7 outputs rendered server-side, saved as MediaAssetVariant-style
        GeneratedGraphicOutput rows, shown as a download grid + "attach to this
        post's social package" action
```

---

## 6. Google Business Profile

### 6.1 Real-world constraint (same category as Instagram/LinkedIn already documented)

The Google Business Profile API (formerly "Google My Business API") requires a
Google-approved API access request and a verified Business Profile — access
requests have been significantly restricted since 2024. This is architecturally
identical to Instagram's Graph API review and LinkedIn's Community Management API
access, both already documented as external, non-code blockers in
`/PORTAL-IMPLEMENTATION.md`. Same conclusion applies: **built for real, gated
behind credentials that don't exist in this environment, Manual mode by default.**

### 6.2 Built as a fifth adapter, not a special case

`lib/portal/social/google-business.ts`, implementing the exact same `SocialAdapter`
interface as the other three:

```ts
export const googleBusinessAdapter: SocialAdapter = {
  platform: 'GOOGLE_BUSINESS',
  isConfigured() {
    return process.env.SOCIAL_GOOGLE_BUSINESS_ENABLED === 'true'
      && Boolean(process.env.GOOGLE_BUSINESS_ACCESS_TOKEN)
      && Boolean(process.env.GOOGLE_BUSINESS_LOCATION_ID);
  },
  formatContent(post) { /* GBP-appropriate summary text + canonical link */ },
  async publish(content) { /* real API call — unreachable in this environment */ },
};
```

Registered in the same `socialAdapters` list `dispatch.ts` already iterates — no
change to the dispatch/queue logic, `retrySocialPost`, or the admin UI's social
package rendering; they're already generic over "whatever's in this array."

### 6.3 v1 scope: `STANDARD` (What's New) posts only

GBP supports several post types (`STANDARD`, `EVENT`, `OFFER`, `PRODUCT`), each
with different required fields (an `EVENT` post needs start/end dates, an `OFFER`
needs terms and a redemption code). "Every published article should generate a
Google Business Profile post" maps cleanly onto `STANDARD` — a summary, a photo,
and a CTA button linking back to the article. `EVENT`/`OFFER` types are a
real, separate feature (they don't come from a news post at all — an event post
comes from an actual event) and are out of scope here; the schema's
`gbpTopicType` field exists specifically so adding them later is additive.

### 6.4 New env vars (`.env.example`)

```
SOCIAL_GOOGLE_BUSINESS_ENABLED=false
# GOOGLE_BUSINESS_ACCESS_TOKEN=
# GOOGLE_BUSINESS_LOCATION_ID=
```

---

## 7. AI Content Package — generation pipeline

### 7.1 Same discipline as everything else in this codebase: no fabrication

This is worth stating as plainly as the rest of this session has treated it: if no
AI API key is configured, the "Generate AI content" button must show **"AI content
generation not configured"** — never silently produce placeholder text disguised
as AI output, never fall back to a canned template dressed up as a suggestion. This
is the same manual-mode-by-default principle the social adapters and GBP already
follow, applied to a feature that's much easier to get away with faking than a
social API call (nobody watching the UI can immediately tell "an AI wrote this"
from "a template string got interpolated") — which is exactly why it needs to be
named explicitly here rather than assumed.

### 7.2 `AIPort` — one more port in `packages/application`, same pattern

```ts
// packages/application/src/ports/ai-content-port.ts
export type AIContentRequest = Readonly<{
  title: string;
  excerpt: string;
  body: string;
  imageDescription?: string;
}>;

export type AIContentPackage = Readonly<{
  seoTitle: string;
  metaDescription: string;
  altText?: string;
  caption: string;
  hashtags: readonly string[];
  suggestedKeywords: readonly string[];
  suggestedCta: string;
}>;

export interface AIContentPort {
  generateContentPackage(request: AIContentRequest): Promise<AIContentPackage>;
  generateImageTags(imageUrl: string): Promise<readonly string[]>;
}
```

One provider-agnostic interface — the implementation
(`lib/portal/ai/anthropic-adapter.ts`, using `@anthropic-ai/sdk`, gated behind
`AI_CONTENT_ENABLED` + `ANTHROPIC_API_KEY`, both absent in this environment) is a
single adapter behind it, exactly like `ObjectStoragePort`'s local-filesystem
implementation today. Swapping providers later, or adding a second provider as a
fallback, touches one file.

### 7.3 What triggers generation

Explicit, per-post, admin-triggered — not automatic on save, not automatic on
publish:

- **"Generate AI content package"** button on the News editor — fills
  `aiSeoTitle`/`aiMetaDescription`/`aiSuggestedHashtags`/`aiSuggestedKeywords`/
  `aiSuggestedCta` as *editable suggestions*, never auto-applied to the live
  `metaTitle`/`metaDescription` fields without a human confirming. AI output is a
  draft an editor approves, not a silent override of what they wrote.
- **"Generate AI tags"** button on a Media Library asset — fills `aiTags`
  (kept separate from manual `keywords`, per Section 3.2).

### 7.4 Cost and rate awareness

Real API calls cost real money per request — the action is explicitly
user-triggered (never background/automatic) specifically so cost stays
predictable and attributable, and the same `isRateLimited()` helper Stage C2
already built for login attempts is reused per-user for this endpoint too (a
different key, same in-memory sliding-window function — no new rate-limiting
mechanism).

---

## 8. Folder structure

```
apps/public-site/
  src/
    app/
      admin/
        media/                    [NEW] — Media Library browse/upload/edit UI
          page.tsx
          [id]/page.tsx
        news/
          [id]/
            page.tsx               [MODIFIED] — add taxonomy, SEO/OG, AI package, gallery sections
            GraphicsPanel.tsx      [NEW] — template picker + generated outputs for this post
        templates/                [NEW] — SocialTemplate management (activate/preview, no visual editor in v1)
          page.tsx
      api/
        portal/
          media/
            [id]/signed-url/route.ts   [NEW] — mirrors documents/photos signed-url pattern
          media-download/route.ts      [NEW] — mirrors documents/download
        erp/                       [NEW, Section 11] — the ERP-facing API boundary
          leads/route.ts
          events/route.ts
      insights/                   [MODIFIED] — category/tag filtering, uses expanded NewsPost fields
    components/
      portal/
        MediaPicker.tsx            [NEW] — reusable asset picker, used by News editor + template flow
    lib/
      portal/
        actions/
          media.ts                 [NEW] — upload, tag, categorize
          templates.ts              [NEW] — generateGraphics action
          ai-content.ts              [NEW] — generateContentPackage, generateImageTags actions
        ai/
          anthropic-adapter.ts       [NEW]
        content-studio/
          templates/                 [NEW] — the ~10 template components + registry.ts
          fonts/                     [NEW] — vendored TTFs for Satori
          brand-tokens.ts            [NEW]
          smart-crop.ts               [NEW] — sharp attention-crop wrapper
          dominant-color.ts            [NEW]
        analytics/
          track.ts                    [NEW] — PageView writer, called from key detail pages
          ga4-port.ts                   [NEW] — AnalyticsPort interface + unconfigured-state implementation

packages/
  application/
    src/ports/
      ai-content-port.ts           [NEW]
      lead-sync-port.ts             [NEW, Section 11]
      analytics-port.ts              [NEW, Section 10]
```

Nothing under `packages/ui-components` or `packages/design-tokens` changes — the
template engine consumes their token *values* (duplicated as constants per Section
5.4) but doesn't import or modify the packages themselves, and no existing public
page component is rewritten (only `insights/page.tsx`/`insights/news/page.tsx`
gain new filter UI additively, same pattern already used to merge in published
`NewsPost` content in Stage C4).

---

## 9. Publishing workflow (unifying all of the above)

```
1. Upload/select images         → Media Library (originals ingested, metadata attached)
2. Draft a News post            → title, excerpt, body, categories, tags
3. Pick featured image + gallery → from Media Library, not a fresh upload
4. [optional] Generate AI content package → editor reviews/edits before applying
5. [optional] Generate social graphics     → pick template(s), review outputs
6. Publish                       → NewsPost.status = PUBLISHED (unchanged from today)
                                  → getPublicNewsItems() merge makes it live immediately (unchanged)
                                  → queueSocialPostsForNewsPost() dispatches to
                                    Instagram/Facebook/LinkedIn/Google Business (extended, not replaced)
                                  → generated graphics (if any) attached to each platform's package
7. Manual-mode packages          → shown in admin for copy/paste, exactly as today
   (still the default everywhere — no credentials exist for any of the 4 platforms
   in this environment)
```

Nothing about steps 6's existing mechanics changes — this section exists to show
that the four new pillars slot into the *front* of an already-working pipeline,
they don't require re-plumbing the publish step itself.

---

## 10. Analytics architecture

### 10.1 Two genuinely different data sources — don't conflate them

**Self-hosted, works immediately, zero external dependency:** "most viewed
projects," "best performing articles" — a `PageView` row written (fire-and-forget,
not blocking the response) whenever a project or article detail page renders.
Aggregated with a straightforward `GROUP BY path` query for the admin dashboard.
This needs nothing external and can be built as part of this phase.

**External, requires real GA4 API credentials that don't exist in this
environment:** "organic traffic," "top keywords," any true search-engine-sourced
metric. `NEXT_PUBLIC_GA_MEASUREMENT_ID` (already configured) sends events *to* GA4
— it does not let this app *read data back out* of GA4. Reading it back requires
Google Analytics Data API + Search Console API service-account credentials, which
is a real external setup step, not a code gap. Same pattern as everything else in
this document: an `AnalyticsPort` interface goes into `packages/application` now;
until real credentials exist, the admin dashboard's "organic traffic"/"top
keywords" panels show a **"Connect Google Analytics"** state with a direct link out
to the real GA4/Search Console dashboards — never fabricated numbers.

### 10.2 "Social engagement"

Same shape as 10.1's external category: real engagement metrics (likes, comments,
reach) live on each platform, not in this app, and in Manual mode (the default)
this app never even knows a post was actually published, let alone how it
performed. Once a platform is switched to Auto mode with real credentials, that
adapter's `publish()` result already includes a `permalink` — a follow-up
`fetchEngagement()` method on the same adapter interface is the natural extension
point when that day comes. Not built now because it would be entirely unreachable
code with nothing to verify it against.

### 10.3 "Lead sources" and "conversion metrics" — the CRM boundary

Per Section 0: this is CRM/BI territory. What this phase *does* build: the
`Enquiry` model gets `referrer`/`utmSource`/`utmMedium`/`utmCampaign`/`landingPath`
fields (Section 4.7), captured automatically from the contact form submission's
request context — the raw attribution signal. What this phase does **not** build:
lead scoring, pipeline stages, source-to-revenue attribution, or a "conversion
rate" dashboard — those require business logic that belongs to the CRM the moment
one exists, and building it in the website now means rebuilding it in the ERP
later. The admin dashboard's "lead sources" panel in this phase is a simple
`GROUP BY utmSource` count over `Enquiry` — real, useful, and honestly scoped to
"where did contact-form submissions come from," not "how do leads convert."

---

## 11. Future ERP integration points

### 11.1 Outbound: what the website tells the ERP

A **domain-event outbox** — not a live webhook call from inside the request that
creates an `Enquiry` (a webhook to a system that doesn't exist yet would just fail
or need to be stubbed out), but a durable log the future ERP can either poll or
have replayed to it once it exists:

```prisma
model DomainEventOutbox {
  id         String   @id @default(cuid())
  occurredAt DateTime @default(now())
  eventType  String   // "enquiry.created" | "project.status_changed" | "newspost.published" | ...
  payload    Json
  deliveredAt DateTime?  // set once a real consumer acknowledges it; null = pending

  @@index([eventType])
  @@index([deliveredAt])
}
```

This mirrors `packages/application`'s existing (currently unimplemented)
`EventBusPort`/`DomainEventEnvelope` shape exactly — `eventType` ↔ `eventType`,
`payload` ↔ `payload`, `occurredAt` ↔ `occurredAt`. When a real event bus exists,
`EventBusPort`'s implementation reads this table instead of the website needing to
know anything about the ERP's transport (message queue, webhook, polling — the
website's job stops at "the event was durably recorded").

Concretely, this phase adds `recordDomainEvent()` calls (same shape as the existing
`recordActivity()` audit helper) at: `Enquiry` creation (with the new attribution
fields), `NewsPost` publish, and `Project.status` changes — the three events an
eventual CRM/BI system would plausibly want first.

### 11.2 Inbound: what the ERP will tell the website (later, not now)

Not built in this phase — named here so the boundary is documented before it's
needed, per your "keep this separation in mind for every future architectural
decision" instruction:

- A future `LeadSyncPort` (ERP → website) would let the website show a client
  "your enquiry status" without the website owning the CRM pipeline itself.
- A future `ProjectSyncPort` could let the ERP become the authoritative source for
  project financials (replacing the website's own simple `Invoice`/`Payment`
  models built in Stage C4) — deliberately **not** designed further here, because
  designing the ERP's own data model is out of scope for a website architecture
  document, and premature coupling to a system that doesn't exist yet is worse than
  no coupling.

### 11.3 What never happens

To close the loop on Section 0 concretely: no CRM table, no quotation model, no
supplier/procurement model, no HR/accounting model gets added to this Prisma
schema, ever, regardless of how convenient it might seem in the moment (e.g., "just
add a `Quotation` model next to `Invoice`, they're similar shape" — resist this;
`Invoice` here is a simple client-facing payment record for the portal, not an ERP
quotation object with approval workflows, and conflating them is exactly the
scope-creep this section exists to prevent).

---

## 12. New dependencies

Consistent with this project's "prefer zero, justify every one" standard
(`/PORTAL-PLAN.md` §13 held new deps to `argon2`, `file-type`, `@prisma/adapter-pg`
— all justified individually):

| Dependency | Why | Alternative considered and rejected |
|---|---|---|
| *(none — `next/og`'s `ImageResponse`)* | Template rendering | A headless-browser renderer (Playwright/Puppeteer) — rejected: heavy runtime dependency, deployment complexity, and this session already established a norm of not carrying that as a production dependency. |
| `@anthropic-ai/sdk` | AI content generation (Section 7) | Raw `fetch` against the API directly — the SDK is thin enough here that either is reasonable; SDK chosen for typed responses and built-in retry handling, genuinely saves code. |
| *(none — `sharp`, already a dependency since Stage C4)* | Smart cropping, dominant-color sampling | A dedicated color-quantization library (e.g., a k-means package) — deliberately deferred per Section 3.4; add only if the approximation proves visibly wrong. |
| *(none — plain `fetch`)* | Google Business Profile API calls | The `googleapis` npm package — rejected: it's a large, generic multi-API client; GBP's REST surface needed here is small enough that a thin typed wrapper over `fetch` (same style as the existing Resend/social adapter calls) avoids a heavy dependency for a handful of endpoints. |

---

## 13. Phased implementation plan

Mirroring how Stage C was broken into C0–C6 (each phase built, verified end-to-end
in a real browser, and committed before the next started) — proposed for the same
reason: each phase is independently shippable and independently verifiable, and
`/admin`-only surfaces mean nothing here needs a "big bang" release.

| Phase | Scope | Depends on |
|---|---|---|
| **CS1** | Media Library foundation — `MediaAsset`/`MediaAssetVariant`/taxonomy schema, upload + metadata UI, smart-crop-on-demand, dominant color | Nothing new — reuses `storage.ts`/`signed-url.ts` |
| **CS2** | News System expansion — featured image/gallery/categories/tags/SEO/OG fields wired into the editor and the public `/insights/news` pages | CS1 (News posts reference `MediaAsset`) |
| **CS3** | Social Template Engine — `next/og` rendering pipeline, brand tokens, fonts, first ~10 templates, generation UI | CS1 |
| **CS4** | AI Content Package — `AIPort`, Anthropic adapter, generation actions + UI, gated by real API key | CS2 (operates on `NewsPost` fields) |
| **CS5** | Google Business Profile adapter | Independent — can run in parallel with CS3/CS4 |
| **CS6** | Analytics — `PageView` self-hosted tracking + dashboard; `AnalyticsPort` unconfigured-state UI; `Enquiry` attribution fields | Independent |
| **CS7** | ERP boundary — `DomainEventOutbox` table + `recordDomainEvent()` calls at the three integration points identified in 11.1 | Independent, but logically last since it has no consumer yet |

Each phase, like Stage C, gets its own commit(s), its own real-browser verification
pass, and its own section in a `/CONTENT-STUDIO-IMPLEMENTATION.md` report — not
started until you approve this document and tell me to begin.

---

## 14. Security & performance considerations

- **Media Library follows C3's authorization model exactly**: uploads/edits require
  `requireSession()` + `requireRole(STAFF_ROLES)` (same as document/photo uploads
  today); asset downloads/variant access go through the same short-lived signed-URL
  pattern, new `media:` token scope, no permanent public path for originals.
  Published `MediaAssetVariant` outputs that get attached to a live `NewsPost`
  (i.e., appear on the public site) are the one deliberate exception — those are
  meant to be public, served like any other public site image, not signed-URL
  gated (gating a public marketing image would just break the public page).
- **AI and GBP endpoints are staff-only and rate-limited** per-user (Section 7.4),
  same `isRateLimited()` mechanism already protecting login/password-reset.
- **Template rendering runs server-side only** — no client-side exposure of font
  files, brand tokens, or generation logic beyond what's already visible in any
  public page's rendered output.
- **Zero performance impact on the public site** — every new admin feature lives
  under `/admin`; the only public-facing code paths touched are the additive
  `insights/*` filter UI (CS2) and the `PageView` write (CS6), which is
  fire-and-forget and must never block or slow a page render if the write fails.

---

## 15. Open decisions — need your input before implementation starts

Named explicitly rather than silently decided, since the previous phase's
"pick the simplest defensible option and continue" autonomy was scoped to
implementation details, not to product/vendor choices with real cost or lock-in:

1. **AI provider**: this document assumes Anthropic (`@anthropic-ai/sdk`) since
   that's the vendor already integrated into your workflow (this conversation).
   OpenAI or another provider is an equally valid architectural fit given the
   `AIContentPort` abstraction — confirm before CS4.
2. **Website Thumbnail / Hero Banner exact dimensions** (Section 5.3) — need five
   minutes against the real `NewsCard`/`HeroSlider` components rather than a
   guessed number; not blocking the rest of the plan, just flagged as unresolved.
3. **Dominant-color accuracy bar** (Section 3.4) — the sharp-sampling approximation
   vs. a proper clustering library is a real quality/complexity trade-off; fine to
   start with the cheap approach and revisit only if it's visibly wrong.
4. **Template visual designs themselves** — this document specifies the
   *engineering* (props, rendering pipeline, brand tokens, registry) for all ~10
   templates, but the actual layout/composition of each one is a design task, not
   an architecture one. Suggest these get mocked (even as quick static comps) before
   CS3 turns them into components, so "professionally designed" is judged against
   an actual design, not code-first guessing at layout.

---

## 16. What does not change

Explicit, since "do not rewrite or remove any working functionality" is the
standing instruction for this phase:

- Every route, model, action, and page shipped in Stage A through D stays exactly
  as it is. Nothing in this plan modifies `Photo`, `Document`, `Project`, `Client`,
  `Invoice`, the auth/session/CSRF/rate-limit layer, the existing `SocialPost`
  dispatch logic for Instagram/Facebook/LinkedIn, or any public page's existing
  content or behavior.
- `PORTAL_ENABLED` gating, the Coming Soon page, and the admin-always-reachable
  behavior are unchanged.
- No existing dependency is removed or downgraded.
- The public site's current SEO output, structured data, and performance profile
  are unaffected until CS2/CS6 land, and both of those are designed above to be
  additive to what's already live.
