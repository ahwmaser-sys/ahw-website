# AHW Architects — Client Portal / Admin Panel / Social Publishing

## Architecture Plan (Stage B)

---

## 1. Existing architecture summary

**This monorepo is bigger than `apps/public-site` alone**, and a real, deliberate
architectural skeleton for exactly this brief already exists — found by reading the
whole workspace, not assumed. Documenting what's actually there before proposing
anything new:

- **`apps/public-site`** — the Next.js 16 (App Router, Turbopack) public marketing site.
  Fully built. Already has `prisma/schema.prisma` (PostgreSQL datasource, one real model:
  `Enquiry`, for the contact form — currently unused pending a production
  `DATABASE_URL`), `@prisma/client`/`prisma` as installed dependencies, and `resend`
  already wired for transactional email (`src/app/api/contact/route.ts`).
- **`apps/web-app`** — a near-empty stub (`src/index.ts` exports one marker constant:
  `applicationSurface = "authenticated-application"`). Its `package.json` depends on
  `@agp/api-client`, `@agp/design-tokens`, `@agp/ui-components`. Reads as the intended
  future home for a **separately-deployed** authenticated application, not yet built.
- **`apps/worker`** — a near-empty stub re-exporting port types. Intended future home for
  background job processing (e.g., social-publish retries, scheduled digests) — nothing
  in this brief strictly requires a separate worker process today.
- **`services/core-api`** — a stub that re-exports port types and eight domain module
  barrels (`project`, `boq`, `document`, `portal`, `dashboard`, `integration`, `export`,
  `audit`, `localization`), each currently just `export {}`. The module *names* map
  almost exactly onto this brief's feature set (`boq` → Bills of Quantities, `integration`
  → the social publishing layer, `portal` → client-portal-specific logic) — someone
  planned this well — but there is no implementation behind any of them.
- **`packages/domain`** — type vocabulary (`EntityId`, `UserId`, `ProjectId`, `Money`,
  `LocaleCode`, `LocalizedText`) plus six aggregate module barrels, every one a literal
  `// TODO: Implement aggregate`.
- **`packages/application`** — eight **port interfaces** (hexagonal-architecture style):
  `IdentityPort` (`verifyAccessToken` → `{ userId, entityId, realm: "internal" | "client"
  | "vendor", roles: string[] }`), `ObjectStoragePort` (`createUploadUrl`/
  `createDownloadUrl`, signed-URL shaped), `EmailPort`, `EventBusPort`, `AuditPort`,
  `CachePort`, `MonitoringPort`, `SearchPort`. Well-designed, genuinely reusable
  *interfaces* — zero implementation.
- **`packages/adapters`** — a single `AdapterProvider` union type naming the intended
  concrete providers: `supabase-auth`, `supabase-postgres`, `supabase-storage`, `resend`,
  `sentry`, `posthog`, `railway`, `vercel`. No adapter implementations exist.
- **`packages/config`** — a `PlatformConfig` type (`appEnv`, `coreApiUrl`,
  `publicSiteUrl`, `webAppUrl`). No runtime config loader exists.
- **`.env.example`** (repo root) — confirms the above: `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`,
  `RESEND_API_KEY`, `SENTRY_DSN`, `POSTHOG_KEY` are all pre-declared. **All are empty** —
  no real Supabase project, no real Postgres, no real credentials exist anywhere in this
  environment. Confirmed: no `docker`, `psql`, or `pg_ctl` binary is available locally
  either, so there is no path to running real PostgreSQL in this environment even
  self-hosted.
- **`packages/ui-components` / `packages/design-tokens`** — fully built, extensively used
  throughout `apps/public-site` (established this engagement: ink/paper/stone palette,
  Inter+Outfit type, `--space-*`/`--font-size-*` token scale, `NativeReveal` motion
  primitives, `Lightbox`, `Header`/`Footer`, `FloatingContactHub`). This is the design
  system the portal/admin UI must extend, per the brief's own explicit instruction.

### Decision: build Stage C inside `apps/public-site`, not the microservice skeleton

This is the single most consequential decision in this plan, made explicitly rather than
by default, and documented here rather than silently chosen:

The brief's own concrete Stage C requirements — a `PORTAL_ENABLED` flag that gates
`/client` with **no redeploy of the public site**, `/admin` reachable regardless of the
flag, specific hand-rolled auth mechanics (bcrypt/argon2 cost factors, manual HttpOnly
session cookies, manual CSRF, manual rate limiting, manual single-use password-reset
tokens) — describe a **monolithic** delivery model: one Next.js app, one deploy unit,
route-level gating. Standing up `services/core-api` as a real, separately-running API
service plus `apps/web-app` as a separately-deployed authenticated SPA would mean
building service-to-service auth, CORS, a second dev server, and a second deploy
pipeline — real infrastructure this brief doesn't ask for, on top of writing the entire
business logic from scratch either way (every aggregate is currently a `TODO` stub, so
"reusing" the skeleton doesn't save implementation work, only adds deployment surface).

Building on Supabase (the adapters skeleton's implied provider) is not viable **honestly**
in this pass either: there are no real Supabase credentials anywhere in this environment,
so anything built against it could not be run or verified locally — a direct conflict
with the Honesty Lock ("never report complete unless verified in the running
application").

**What gets reused, concretely, so this isn't a parallel rewrite:**
- `apps/public-site/prisma/schema.prisma` is **extended**, not replaced — the existing
  `Enquiry` model stays exactly as-is, new models are added alongside it.
- The `packages/domain` type vocabulary (`EntityId`, `UserId`, `ProjectId`, `Money`,
  `LocaleCode`) is imported and used directly in the new Prisma schema and service layer
  rather than re-invented.
- The `packages/application` port *shapes* are followed even though their packages
  aren't directly wired in: the new `lib/portal/storage.ts` matches `ObjectStoragePort`'s
  `createUploadUrl`/`createDownloadUrl` signature; `lib/portal/email.ts` matches
  `EmailPort`; the JWT/session payload matches `AuthenticatedPrincipal`'s
  `{ userId, entityId, realm, roles }` shape. This keeps a real, documented path to
  eventually wiring these into the actual `@agp/application` interfaces if/when
  `services/core-api` gets built out for real, without a rewrite of the call sites.
- `resend` (already a dependency, already used for the contact form) is reused for
  portal transactional email (verification, password reset, notifications) rather than
  adding a second email library.

**What's deliberately NOT done:** implementing `services/core-api`'s module stubs,
`apps/web-app`, or any Supabase adapter. These remain exactly as found. If the business
later wants a genuinely separate portal deployment (`portal.ahwspaces.com`, a real
microservice split), this plan's data-access layer (see §2) is built specifically to make
that migration mechanical rather than a rewrite — see §9.

### Local database: real local PostgreSQL via `prisma dev`, matching production exactly

**Revised after further investigation, documented rather than silently corrected:** no
system-level `docker`/`psql`/`pg_ctl` is available (confirmed above), but
`corepack pnpm exec prisma dev` (a genuine Prisma CLI subcommand — not Supabase, no
account or external credentials needed) downloads and runs a real local PostgreSQL
server on its own, and the `prisma+postgres://localhost:51213/...` URL already sitting in
`apps/public-site/.env` is exactly the connection string it expects. Started it
(`prisma dev -d`, detached) and confirmed real connectivity with `prisma db pull`
(returned `P4001: introspected database was empty` — i.e. it connected and queried
successfully; empty is expected pre-migration). This means `schema.prisma`'s existing
`provider = "postgresql"` needs **no change at all** — local development, this pass's
verification, and the declared production target are the same database engine, not an
engine-swap-later situation. Every migration, seed, and query in Stage C is executed
against real PostgreSQL, not SQLite. The one caveat: this local server is
this-machine-only and not itself the production database — the migration path to a real
hosted Postgres (Supabase or otherwise) is still `DATABASE_URL` pointed at the new target
plus `prisma migrate deploy`, same as any Prisma project, detailed again in §12.

---

## 2. Proposed folder structure

```
apps/public-site/
  prisma/
    schema.prisma                 [MODIFY] — add new models alongside existing Enquiry
    seed.ts                       [NEW] — seeds SUPER_ADMIN from env vars
  src/
    app/
      client/                     [NEW] — Client Portal route group
        layout.tsx                [NEW] — Coming Soon gate + portal chrome
        page.tsx                  [NEW] — dashboard
        login/page.tsx            [NEW]
        forgot-password/page.tsx  [NEW]
        reset-password/[token]/page.tsx  [NEW]
        projects/[id]/page.tsx    [NEW] — project overview, progress, timeline
        projects/[id]/documents/page.tsx      [NEW]
        projects/[id]/gallery/page.tsx        [NEW]
        projects/[id]/financials/page.tsx     [NEW]
        messages/page.tsx         [NEW]
        profile/page.tsx          [NEW]
      admin/                      [NEW] — Admin Panel route group
        layout.tsx                [NEW] — SUPER_ADMIN/ADMIN/EDITOR gate (see §5)
        page.tsx                  [NEW] — dashboard
        login/page.tsx            [NEW] — separate from /client/login (see §4)
        clients/page.tsx          [NEW]
        clients/[id]/page.tsx     [NEW]
        projects/page.tsx         [NEW]
        projects/[id]/page.tsx    [NEW]  — edit, milestones, progress%, uploads
        news/page.tsx             [NEW]  — list/create/schedule/publish
        news/[id]/page.tsx        [NEW]  — edit + per-platform social status (Stage D)
        messages/page.tsx         [NEW]
      api/
        portal/
          auth/login/route.ts             [NEW]
          auth/logout/route.ts            [NEW]
          auth/register/route.ts          [NEW] — admin-created clients only, see §4
          auth/verify-email/route.ts      [NEW]
          auth/forgot-password/route.ts   [NEW]
          auth/reset-password/route.ts    [NEW]
          projects/route.ts               [NEW]
          projects/[id]/route.ts          [NEW]
          documents/[id]/download/route.ts [NEW] — signed-URL gated
          photos/route.ts                 [NEW]
          messages/route.ts               [NEW]
          news/route.ts                   [NEW]
          news/[id]/publish/route.ts      [NEW] — Stage D dispatch
        contact/route.ts         [MODIFY? no] — untouched, existing, unrelated
    lib/
      portal/
        db.ts                    [NEW] — Prisma client singleton
        session.ts               [NEW] — cookie session create/verify/destroy
        password.ts              [NEW] — argon2id hash/verify
        csrf.ts                  [NEW] — double-submit token issue/verify
        rate-limit.ts            [NEW] — in-memory sliding-window limiter (see §12 re: scaling)
        auth-guard.ts            [NEW] — requireSession()/requireRole() helpers, deny-by-default
        storage.ts               [NEW] — ObjectStoragePort-shaped local filesystem adapter (see §6)
        email.ts                 [NEW] — thin wrapper over existing `resend` usage
        audit.ts                 [NEW] — AuditPort-shaped Prisma writer
      social/
        types.ts                 [NEW] — PlatformAdapter interface (Stage D)
        registry.ts              [NEW] — flag-driven adapter lookup
        adapters/
          instagram.ts           [NEW] — manual-mode formatter + auto-mode stub behind flag
          facebook.ts            [NEW]
          linkedin.ts            [NEW]
        format.ts                [NEW] — per-platform caption/hashtag/crop generation
    components/
      portal/                    [NEW] — Client Portal UI, reusing @agp/ui-components tokens
      admin/                     [NEW] — Admin Panel UI, same reuse
  storage/                       [NEW, gitignored] — local file storage root (see §6)
  middleware.ts                  [MODIFY] — add portal noindex + admin/client route protection

packages/ui-components/src/
  components/portal/             [NEW, minimal] — only if something is genuinely shared
                                  between marketing site and portal beyond raw tokens
                                  (expect: little to nothing new here — see §9 note on
                                  why portal UI stays inside apps/public-site, not the
                                  shared package)
```

**Existing files modified, and why each needs it:**
- `apps/public-site/prisma/schema.prisma` — add all new models (§3); `Enquiry` untouched.
- `apps/public-site/middleware.ts` (does not exist yet — this itself counts as new, but
  listed here since it's the mechanism, not a portal feature) — the single place that
  enforces `noindex`/route protection/`PORTAL_ENABLED` gating for every `/client` and
  `/admin` request, so a new route under either path is protected by default (brief's
  own C3 requirement: "a new endpoint is secure unless explicitly opened").
- `apps/public-site/next-sitemap`/`src/app/sitemap.ts`, `src/app/robots.ts` — excluded
  patterns added for `/client`, `/admin` (§8).
- `apps/public-site/package.json` — new dependencies (§13).

**No existing public-site component, route, token, or page outside the above is
modified.** No file is renamed or moved.

---

## 3. Database schema

SQLite locally (see §1), PostgreSQL in production — Prisma schema, not raw SQL, so the
same model definitions produce correct migrations for both engines.

```prisma
// ── Identity & Access ──
model User {
  id                String    @id @default(cuid())
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  email             String    @unique
  passwordHash      String
  role              Role
  status            UserStatus @default(ACTIVE)
  emailVerifiedAt   DateTime?
  name              String
  phone             String?

  // Client-realm users are linked to exactly one Client record. Staff
  // (SUPER_ADMIN/ADMIN/EDITOR) have no Client — realm is inferred from
  // role, not a separate column (avoids two sources of truth going out
  // of sync — see AuthenticatedPrincipal.realm in packages/application,
  // whose shape this maps onto at the session-token layer, not the DB).
  client            Client?   @relation(fields: [clientId], references: [id])
  clientId          String?   @unique

  memberships       ProjectMember[]
  sentMessages      Message[]        @relation("MessageSender")
  notifications     Notification[]
  activityLogs      ActivityLog[]
  sessions          Session[]
  passwordResets    PasswordResetToken[]
  emailVerifications EmailVerificationToken[]

  @@index([role])
}

enum Role {
  SUPER_ADMIN
  ADMIN
  EDITOR
  CLIENT
}

enum UserStatus {
  ACTIVE
  DISABLED
}

model Session {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash   String   @unique   // session cookie value is opaque; only its hash is stored
  createdAt   DateTime @default(now())
  expiresAt   DateTime
  ipAddress   String?
  userAgent   String?

  @@index([userId])
}

model PasswordResetToken {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash  String   @unique   // single-use, time-limited, hashed — never store the raw token
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())
}

model EmailVerificationToken {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash  String   @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())
}

// ── Clients & Projects ──
model Client {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  companyName   String
  user          User?
  projects      ProjectMember[]
}

model Project {
  id              String    @id @default(cuid())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  name            String
  description     String?
  progressPercent Int       @default(0)
  status          ProjectStatus @default(ACTIVE)

  members         ProjectMember[]
  milestones      Milestone[]
  updates         ProjectUpdate[]
  photos          Photo[]
  documents       Document[]
  invoices        Invoice[]
  messages        Message[]
  activityLogs    ActivityLog[]

  @@index([status])
}

enum ProjectStatus {
  ACTIVE
  ON_HOLD
  COMPLETED
}

// Explicit join table, not an implicit m:n — real per-membership metadata
// (role-on-project, joinedAt) is exactly the kind of thing that gets asked
// for two weeks after an implicit relation ships.
model ProjectMember {
  id         String   @id @default(cuid())
  projectId  String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId     String?
  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  clientId   String?
  client     Client?  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  joinedAt   DateTime @default(now())

  @@unique([projectId, userId])
  @@unique([projectId, clientId])
  @@index([projectId])
}

model Milestone {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  dueDate     DateTime?
  completedAt DateTime?
  sortOrder   Int       @default(0)

  @@index([projectId])
}

model ProjectUpdate {
  id         String   @id @default(cuid())
  projectId  String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  authorId   String
  body       String
  createdAt  DateTime @default(now())

  @@index([projectId])
}

model Photo {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  storageKey  String   // opaque key into ObjectStoragePort — never a public path (§6)
  caption     String?
  phase       PhotoPhase @default(DURING)
  takenAt     DateTime?
  createdAt   DateTime @default(now())

  @@index([projectId])
}

enum PhotoPhase {
  BEFORE
  DURING
  AFTER
}

model Document {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  storageKey  String
  fileName    String
  fileType    String   // validated actual content-type, not just the extension (§6/C6)
  fileSize    Int
  category    DocumentCategory
  uploadedById String
  createdAt   DateTime @default(now())

  @@index([projectId])
}

enum DocumentCategory {
  DRAWING
  CONTRACT
  BOQ
  REPORT
  WARRANTY
  INVOICE
  OTHER
}

model Invoice {
  id           String   @id @default(cuid())
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  amount       Decimal
  currency     String   @default("USD")  // matches domain's Money.currency (CurrencyCode)
  status       InvoiceStatus @default(PENDING)
  dueDate      DateTime?
  documentId   String?  // the actual invoice PDF, stored via Document
  createdAt    DateTime @default(now())

  payments     Payment[]

  @@index([projectId])
}

enum InvoiceStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
}

model Payment {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amount      Decimal
  paidAt      DateTime @default(now())
  method      String?
  reference   String?
}

// ── Communication ──
model Notification {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title      String
  body       String
  readAt     DateTime?
  createdAt  DateTime @default(now())

  @@index([userId])
}

model Message {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  senderId    String
  sender      User     @relation("MessageSender", fields: [senderId], references: [id])
  body        String
  createdAt   DateTime @default(now())

  @@index([projectId])
}

// ── Content & Social (Stage D) ──
model NewsPost {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  title         String
  slug          String   @unique
  excerpt       String
  body          String
  coverImageKey String?
  status        NewsPostStatus @default(DRAFT)
  publishedAt   DateTime?
  authorId      String

  socialPosts   SocialPost[]

  @@index([status])
}

enum NewsPostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
}

model SocialPost {
  id           String   @id @default(cuid())
  newsPostId   String
  newsPost     NewsPost @relation(fields: [newsPostId], references: [id], onDelete: Cascade)
  platform     SocialPlatform
  mode         SocialPostMode
  status       SocialPostStatus @default(PENDING)
  caption      String?
  permalink    String?
  errorMessage String?
  attemptCount Int      @default(0)
  postedAt     DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([newsPostId, platform])
  @@index([status])
}

enum SocialPlatform {
  INSTAGRAM
  FACEBOOK
  LINKEDIN
}

enum SocialPostMode {
  AUTO
  MANUAL
}

enum SocialPostStatus {
  PENDING
  POSTED
  MANUAL
  FAILED
}

// ── Audit ──
model ActivityLog {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now())
  actorId    String?
  actorEmail String?
  action     String   // e.g. "auth.login", "auth.login_failed", "project.create", "document.download"
  entityType String?
  entityId   String?
  projectId  String?
  project    Project? @relation(fields: [projectId], references: [id])
  metadata   String?  // JSON-encoded, deliberately loose — audit rows must never fail to
                       // write because a new event type doesn't fit a rigid column set
  ipAddress  String?

  @@index([action])
  @@index([actorId])
}
```

**Relationships/constraints notes:**
- `ProjectMember` is an explicit join model (not implicit m:n) specifically so C3's
  ownership checks have a real row to query against per user×project, and so
  `@@unique([projectId, userId])` prevents duplicate memberships at the DB level, not
  just in application code.
- Every child-of-Project model cascades on delete — deleting a project is expected to be
  a genuine, rare admin action, not something that should leave orphaned rows.
- `ActivityLog.metadata` is a loose JSON string, not a rigid column set, because an audit
  log that can fail to write a legitimate new event type because the schema doesn't have
  a column for it is worse than one with a slightly-untyped payload.

---

## 4. Authentication architecture

- **Two separate login surfaces**, not one shared login page: `/client/login` (Role.CLIENT
  only) and `/admin/login` (SUPER_ADMIN/ADMIN/EDITOR only) — issuing a session from the
  wrong surface for the wrong realm is exactly the kind of mistake that's cheap to
  prevent at the routing layer and expensive to clean up after.
- **No public registration.** Clients are created by an admin (C4); admins are seeded
  (C1) or created by a SUPER_ADMIN. `api/portal/auth/register` exists only as an
  internal, admin-authenticated endpoint — never a public sign-up form.
- **Password hashing:** `argon2id` (via the `argon2` package, §13) — the brief's own
  first-listed preference, and the current OWASP-recommended default over bcrypt for new
  systems.
- **Sessions:** opaque random token (32 bytes, `crypto.randomBytes`) stored in an
  `HttpOnly; Secure; SameSite=Lax` cookie; only the token's SHA-256 hash is persisted in
  `Session.tokenHash` (so a database read alone can never yield a usable session token).
  `SameSite=Lax` rather than `Strict`, since `Strict` breaks a client clicking a password-
  reset link from their email client into a fresh tab.
- **CSRF:** double-submit cookie pattern — a non-HttpOnly `csrf_token` cookie plus a
  matching header/form field on every state-changing request, verified in
  `lib/portal/csrf.ts` before any mutation runs.
- **Rate limiting:** in-memory sliding-window limiter (`lib/portal/rate-limit.ts`) keyed
  by IP+route, applied to login, password-reset request, and message-send endpoints. Documented
  in §12 as a single-instance limitation, not silently glossed over.
- **Password reset:** single-use, time-limited (1 hour), hashed token
  (`PasswordResetToken`) — the raw token is emailed once, only its hash is ever stored,
  matching the `Session` pattern.
- **Email verification:** same single-use/time-limited/hashed pattern
  (`EmailVerificationToken`), sent on client-account creation.
- **Login errors are generic** ("Invalid email or password") regardless of whether the
  email exists, a wrong password was given, or the account is disabled — never a
  distinguishing message.
- **Audit logging:** every login attempt (success and failure), logout, password reset
  request/completion, and email verification writes an `ActivityLog` row via
  `lib/portal/audit.ts` (shaped like `AuditPort.record()`).
- **Session payload**, once verified, is shaped exactly like `packages/application`'s
  `AuthenticatedPrincipal` (`{ userId, entityId, realm, roles }`) even though it's
  produced by this app's own `session.ts`, not a real `IdentityPort` implementation —
  this is what makes a future real `IdentityPort` adapter a drop-in replacement instead
  of a rewrite of every call site that reads the current user.

---

## 5. Permissions model

Enforced at the data layer (`lib/portal/auth-guard.ts`), never the UI alone — a hidden
button is not authorization (brief's own explicit C3 principle).

| Resource / Action | SUPER_ADMIN | ADMIN | EDITOR | CLIENT |
|---|---|---|---|---|
| View all clients | ✅ | ✅ | ✅ (read-only) | ❌ |
| Create/edit/disable clients | ✅ | ✅ | ❌ | ❌ |
| Reset another user's password | ✅ | ✅ | ❌ | ❌ (self-service only) |
| View all projects | ✅ | ✅ | ✅ | ❌ |
| View own project(s) | ✅ | ✅ | ✅ | ✅ (own only, via `ProjectMember`) |
| Create/edit project, set progress/milestones | ✅ | ✅ | ✅ | ❌ |
| Delete a project | ✅ | ❌ | ❌ | ❌ |
| Upload documents/photos | ✅ | ✅ | ✅ | ❌ |
| Download documents/photos | ✅ | ✅ | ✅ | ✅ (own project only) |
| Publish project update | ✅ | ✅ | ✅ | ❌ |
| Send/read project messages | ✅ | ✅ | ✅ | ✅ (own project only) |
| Create/edit/publish news posts | ✅ | ✅ | ✅ | ❌ |
| Manage social platform flags/credentials | ✅ | ❌ | ❌ | ❌ |
| View activity/audit log | ✅ | ✅ (own actions + client-facing events) | ❌ | ❌ |
| Manage admin users (create/disable/role) | ✅ | ❌ | ❌ | ❌ |
| Access `/admin` at all | ✅ | ✅ | ✅ | ❌ |
| Access `/client` at all | ❌ | ❌ | ❌ | ✅ |

**Enforcement pattern:** every `api/portal/*` route handler starts with
`const principal = await requireSession(request)` (401 if absent/expired), then
`requireRole(principal, [...])` (403 if wrong role) where relevant, then — for anything
scoped to a specific project/document/invoice — an explicit
`requireProjectAccess(principal, projectId)` that queries `ProjectMember` directly. This
is a function every new endpoint must call, not a global middleware alone, because a
global check can confirm "logged in" and "right role" but cannot know which project ID a
specific request body/param refers to — that check has to happen at the resource, every
time, which is exactly what C3 asks to be verified by attempting cross-client access for
real (see the Implementation report's Security Verification section).

---

## 6. Storage architecture

- **Abstraction first:** `lib/portal/storage.ts` exports a `StoragePort` interface
  matching `packages/application`'s `ObjectStoragePort` shape
  (`createUploadUrl(key, ttl)` / `createDownloadUrl(key, ttl)`), so swapping the backing
  implementation later (e.g., to Supabase Storage or S3) means writing one new adapter
  file, not touching any route handler.
- **This pass's implementation:** local filesystem, rooted at
  `apps/public-site/storage/` (gitignored, outside `public/` on purpose — nothing in
  that directory is ever statically served by Next.js, unlike the public marketing
  site's own portfolio images, see A5's finding about those). "Signed URLs" in local mode
  are short-lived, HMAC-signed tokens embedded in a query string against a dedicated
  `api/portal/documents/[id]/download` route handler that verifies the signature, the
  requester's session, and their `ProjectMember` row before streaming the file — the
  same access-control properties a real cloud signed URL provides, just self-issued
  rather than issued by a cloud provider.
- **Never a permanent direct file path.** No file under `storage/` is ever linked to
  directly; every access goes through the signed-URL route handler.
- **Upload validation:** file size capped (documents 25MB, photos 10MB — configurable),
  and the actual content-type is sniffed from the file's magic bytes (`file-type`
  package, §13) and cross-checked against an explicit allowlist per category — never
  trusting the client-supplied extension or `Content-Type` header alone (brief's
  explicit C6 requirement).
- **Image optimization on upload:** photos are re-encoded through `sharp` (already a
  workspace dependency, used extensively earlier in this engagement) to a capped
  resolution and AVIF/WebP, mirroring the exact pattern already established for the
  public site's own images.
- **Migration path to cloud storage:** implement a second file,
  `lib/portal/storage-supabase.ts` (or S3/R2 equivalent), satisfying the same
  `StoragePort` interface, and swap one import in `lib/portal/storage.ts`'s factory
  function. No route handler changes.

---

## 7. Social publishing architecture (Stage D detail — summarized here for completeness)

- `lib/social/types.ts` defines `PlatformAdapter`: `{ platform, isAutoModeAvailable():
  boolean, formatContent(post: NewsPost): FormattedContent, publish?(content):
  Promise<PublishResult> }` — `publish` is optional on the interface itself, since manual
  mode has no publish step at all.
- One file per platform under `lib/social/adapters/` — each reads its own env vars
  (`INSTAGRAM_*`, `FACEBOOK_*`, `LINKEDIN_*`) and its own feature flag
  (`SOCIAL_INSTAGRAM_ENABLED` etc.), independent of the other two.
- `lib/social/registry.ts` is the only place that knows about all three adapters — adding
  a fourth platform means one new adapter file plus one new line in the registry, never a
  change to `api/portal/news/[id]/publish/route.ts` or any UI component (brief's D1
  requirement, made concrete).
- Full detail (manual/auto mode switch, per-platform formatting rules, status tracking,
  retry/backoff) in the Stage D section of `/PORTAL-IMPLEMENTATION.md` once built and
  verified, per the brief's own "state root cause / design before fixing" spirit applied
  to "build before over-documenting a plan for code that doesn't exist yet."

---

## 8. Coming Soon gating

- Single source of truth: `process.env.PORTAL_ENABLED === 'true'`, read once in
  `apps/public-site/middleware.ts`.
- **Flag off:** any request to `/client/*` is rewritten (not redirected — the URL stays
  `/client/...`, so no external link ever breaks) to a dedicated `/client/coming-soon`
  page built from existing tokens/typography (no second design language). `/admin/*`
  remains fully reachable regardless of the flag, gated only by the SUPER_ADMIN session
  check in its own layout — this is explicit in the brief ("so I can test while hidden")
  and implemented as a separate condition, not accidentally tied to the same flag.
- **No public links** to `/client` or `/admin` anywhere in `Header`, `Footer`,
  `FloatingContactHub`, or any page body, checked by grep across `packages/ui-components`
  and `apps/public-site/src/app` as part of C0's own verification, not assumed.
- **`robots.txt`** (`apps/public-site/src/app/robots.ts`) gets `disallow: ['/client',
  '/admin']` unconditionally — not flag-dependent, since even the Coming Soon page and
  the admin login screen shouldn't be indexed.
- **`sitemap.xml`** (`apps/public-site/src/app/sitemap.ts`) never includes `/client` or
  `/admin` routes — there was never a code path that would add them, so this is a
  verification item (confirm the generator only iterates public content) rather than a
  new exclusion rule to write.
- **Per-route `noindex`:** every page under `/client` and `/admin` sets
  `robots: { index: false, follow: false }` in its own metadata, in addition to the
  `robots.txt` disallow — defense in depth, since `robots.txt` only asks crawlers not to
  *crawl*, not that they won't index a URL discovered elsewhere.
- **Flipping the flag requires zero code changes and zero redeploy of the public site**
  by construction: it's a runtime env var read in middleware, not a build-time constant —
  changing it and restarting the Node process (or, in most hosts, just updating the env
  var and letting the platform's existing restart mechanism pick it up) is the entire
  activation step.

---

## 9. Deployment impact — routing flexibility without re-architecture

Because `/client` and `/admin` are plain Next.js route segments inside
`apps/public-site` (not a separate app), today's deployment is exactly one app, exactly
as it is now, with two more top-level route groups. The path to `ahwspaces.com/client`
vs. a future `portal.ahwspaces.com`:

- **Today (`ahwspaces.com/client`):** already true, zero extra work — it's just a route.
- **Later, if wanted (`portal.ahwspaces.com`):** the reason this doesn't require a
  rewrite is that every portal-specific piece of logic already lives behind an
  abstraction with exactly one concrete implementation call site: `lib/portal/storage.ts`
  (§6), the Prisma client singleton (`lib/portal/db.ts`), and the session/auth helpers
  are all imported only from within `app/client/*`, `app/admin/*`, and `app/api/portal/*`
  — never from the public marketing pages. Moving those three directories into a new
  `apps/web-app` (finally giving that stub real content) and pointing it at the same
  database is a **copy-and-repoint** operation, not a redesign: the Prisma schema, the
  auth mechanics, and the storage abstraction all transfer unchanged. The public
  marketing site loses nothing and needs no changes either way, since it never imported
  portal code to begin with.
- This is the concrete answer to "keep the data layer behind an abstraction... note which
  decisions would be expensive to undo": the **cheap-to-undo** decisions are exactly
  these boundaries (storage, session mechanics, DB access) — deliberately kept behind a
  single-call-site abstraction specifically so this later split stays possible without
  becoming an expensive rewrite. See §12 for the decisions that are genuinely expensive
  to reverse.

---

## 10. Security considerations

- Authorization enforced at the data layer, never inferred from the UI (§5).
- Every state-changing endpoint requires a valid session + CSRF token; verified for real
  in the Implementation report by attempting an unauthenticated mutation and a
  missing-CSRF mutation and confirming both are rejected, not assumed from the code.
- Passwords: argon2id, never logged, never included in any API response (Prisma's
  generated types make it easy to accidentally `SELECT *` a user row into a response —
  every user-returning endpoint explicitly `select`s only safe fields).
- Documents/photos: signed, short-lived, per-request-verified URLs only (§6) — never a
  permanent public path.
- Rate limiting on login, password reset, and message endpoints (§4), specifically to
  blunt credential-stuffing and reset-token-guessing.
- Generic auth error messages (§4) — never confirm or deny that an email exists.
- All authentication events and all admin mutations write to `ActivityLog`.
- Security headers: the existing `next.config.js` `headers()` (CSP, X-Frame-Options,
  etc. — already present, established earlier this engagement) already apply site-wide,
  including `/client` and `/admin`, with no changes needed.
- Input validation: every `api/portal/*` route validates its body with a `zod` schema
  (matching the existing `contactFormSchema` pattern already used in
  `features/contact/validation/`) before touching the database.

---

## 11. Performance impact on the public site — must be zero

- No portal code is imported from any public route, layout, or shared component — the
  public site's own bundle is unaffected (`apps/public-site/src/app/(public routes)`
  never imports from `app/client`, `app/admin`, `app/api/portal`, or `lib/portal`).
- `middleware.ts` is the one file that runs on every request, including public ones —
  kept deliberately minimal (a `PORTAL_ENABLED` env read plus a path-prefix check, no
  database call, no external fetch) so it adds effectively zero latency to public-page
  requests. Verified in the Implementation report by confirming public-page response
  times are unchanged before/after, not assumed from code inspection alone.
- New Prisma models add zero runtime cost to public pages, since the public site's
  existing pages don't query the database at all today (all project/content data is
  static TypeScript, per this engagement's whole history) — the new `db.ts` client is
  only ever imported by portal code paths.
- New dependencies (§13) are only imported by portal/admin route code, so Next.js's own
  per-route code splitting keeps them out of the public site's shipped JS.

---

## 12. Migration strategy

- **Schema:** `prisma migrate dev` locally against the real local PostgreSQL server
  started via `prisma dev` (§1). Before a real deploy, point `DATABASE_URL` at the
  production Postgres instance (Supabase or otherwise) and run `prisma migrate deploy` —
  since local and production are both genuine PostgreSQL, the migration SQL files
  generated this pass are the same SQL that applies in production; no schema-provider
  swap or migration-history discontinuity to worry about.
- **Seed:** `prisma/seed.ts` creates exactly one `SUPER_ADMIN` from
  `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` env vars (never hardcoded, per C1) and
  nothing else — no demo clients/projects seeded into what could become a production
  database by accident.
- **Rollback:** every `prisma migrate dev` step is a reversible, timestamped migration
  file under `prisma/migrations/` — standard Prisma rollback (`migrate resolve` /
  restoring the prior migration) applies, nothing custom.
- **Expensive-to-reverse decisions, named explicitly, per the brief's own request:**
  - **`Role` as a Prisma enum, not a `Role` table.** Cheap now (one migration), expensive
    later if the business wants admin-configurable custom roles beyond these four —
    would need a real `Role`/`Permission` table migration and a data backfill. Chosen
    anyway because the brief specifies exactly four fixed roles; over-building a
    fully dynamic permission system for roles that don't exist yet would itself violate
    "never invent" in spirit.
  - **`ProjectMember` as the sole ownership-scoping mechanism.** Every authorization
    check in §5 assumes a project's access list *is* its `ProjectMember` rows. This is
    the right call for a portal where "which clients can see this project" is the
    entire access model — but if a future requirement needs document-level or
    milestone-level permission overrides (a client who should see the project but not
    its financials, say), that's a new, additive table, not a change to this one — kept
    that way on purpose.
  - **Local filesystem storage (§6).** Cheap to swap (one adapter file, per the
    abstraction) *in code*. Expensive in the other direction: any files actually
    uploaded during local development/testing live only on this machine and would need
    a real migration script to move into whatever cloud storage is chosen later — not a
    concern for this pass (no real client data exists yet) but worth naming so it isn't
    a surprise later.

---

## 13. New dependencies — each justified, minimum necessary

| Package | Why | Alternative considered |
|---|---|---|
| `argon2` | Password hashing (brief's first-listed preference; OWASP current default) | `bcrypt` — also acceptable per the brief, `argon2` chosen as the stronger default |
| `zod` | Request body validation for every new API route | Already a dependency (`react-hook-form` + `zod` resolver already used in `ContactForm`/`CareersForm`) — **zero new dependency**, just wider use of an existing one |
| `@prisma/client` / `prisma` | Database ORM/migrations | **Already installed**, zero new dependency — this pass just uses what's there |
| `resend` | Transactional email (verification, password reset, notifications) | **Already installed and already used** for the contact form — zero new dependency |
| `sharp` | Image re-encoding on upload | **Already a workspace dependency**, used extensively for the public site's own images this engagement — zero new dependency |
| `file-type` | Sniff real content-type from uploaded file bytes, not just the extension | Hand-rolled magic-byte checking — rejected, this is exactly the kind of narrow, well-tested utility not worth re-implementing |

**Genuinely new packages: two** (`argon2`, `file-type`) — everything else this plan
depends on is already in the workspace. No new HTTP framework, no new ORM, no new state
management library, no new CSS approach — every UI piece reuses `@agp/ui-components` and
`@agp/design-tokens` exactly as they stand.
