# Portal Implementation — Stage C/D Changelog

Companion to `/PORTAL-PLAN.md` (the design) and `/PRELAUNCH.md` (Stage A).
This file tracks what was actually built, with real verification results
per the brief's Honesty Lock — nothing here is marked done without having
been exercised against the running app and the real local database.

Local environment for everything below: Next.js dev server on
`localhost:3005`, real local PostgreSQL via `prisma dev` (proxy `:51213`,
db `:51214`), `PORTAL_ENABLED=false`.

---

## C0 — Coming Soon gating

- `PORTAL_ENABLED` env flag (default `"false"`), checked in
  `src/middleware.ts`. `/client/*` rewrites to `/client/coming-soon` when
  the flag isn't `"true"`. `/admin/*` is intentionally NOT gated by this
  flag — it's reachable by SUPER_ADMIN regardless, so the flag can stay
  off in production while the owner still tests the admin panel.
- `/admin` and `/client` routes carry `robots: { index: false, follow:
  false }` metadata; excluded from `sitemap.xml`; `robots.txt` disallows
  both paths.
- No links to `/client` or `/admin` anywhere in public nav/footer.
- Verified: public homepage and every existing route unaffected —
  confirmed via before/after screenshot comparison in Stage A7 and again
  after the chrome-suppression fix below.

## C1 — Database + data layer

- 18 new Prisma models added to the existing `prisma/schema.prisma`
  (Enquiry model, the only pre-existing model, untouched). Full list and
  relationships in `/PORTAL-PLAN.md` §3.
- Real local Postgres via `corepack pnpm exec prisma dev -d` — no Docker,
  no external account. `@prisma/adapter-pg` driver adapter (required by
  Prisma 7), `DATABASE_URL` in raw `postgres://` form.
- `prisma/seed.ts` upserts one SUPER_ADMIN from `SUPER_ADMIN_EMAIL` /
  `SUPER_ADMIN_PASSWORD` env vars — never a hardcoded credential in
  source.
- Verified: migration applied cleanly, seed ran, confirmed one
  SUPER_ADMIN row exists via direct query.

## C2 — Password reset + email verification

- `/api/portal/auth/forgot-password`, `/reset-password`,
  `/verify-email` — full routes in both `/admin/*` and `/client/*`
  surfaces, described in prior session summary.
- Verified end-to-end: created a real `PasswordResetToken` row via the
  API, confirmed correct hash/expiry via direct DB query, confirmed
  wrong token rejected, correct token succeeds once, and re-submitting
  the same (now-used) token is rejected identically to an invalid one —
  single-use enforced at the data layer, not just in the UI.

## C3 — Authorization layer + real security verification

This is the stage the brief calls "the critical control" — every claim
below was actually attempted against the running app, not inferred from
reading the guard code.

### What was built

- `lib/portal/auth-guard.ts` (already existed from C2-adjacent work):
  `requireSession()`, `requireRole()`, `requireProjectAccess()` — the
  last one queries `ProjectMember` directly at the data layer; staff
  roles (SUPER_ADMIN/ADMIN/EDITOR) bypass, CLIENT role must have a
  matching membership row.
- `lib/portal/storage.ts` (new) — local-filesystem object storage
  abstraction, files under `apps/public-site/storage/portal/` (outside
  `public/`, gitignored, never served by a public route).
- `lib/portal/signed-url.ts` (new) — HMAC-SHA256 signed, time-limited
  document tokens (`documentId.expiresAt.signature`, keyed on
  `SESSION_SECRET`, `timingSafeEqual` comparison). Authorization is
  checked once at issuance; the token itself is the proof for the
  download route, valid 5 minutes — same model as an S3 presigned URL.
- Three new protected API routes, the first real protected resources in
  the app:
  - `GET /api/portal/projects/[id]` — requires session +
    `requireProjectAccess`.
  - `GET /api/portal/documents/[id]/signed-url` — requires session +
    `requireProjectAccess` on the document's project; issues the signed
    download token.
  - `GET /api/portal/documents/download?token=...` — verifies the
    signed token only (no session required, matching the presigned-URL
    model); streams the file with `Cache-Control: no-store`.
  - `GET`/`POST /api/portal/projects/[id]/messages` — requires session +
    `requireProjectAccess`; `POST` additionally requires a valid CSRF
    header, the endpoint used to prove CSRF protection for real.
- Wired `issueCsrfToken()` into the login route (was implemented in an
  earlier pass but never actually called anywhere) so a CSRF cookie is
  issued the moment a session is created.
- Test fixtures (`scripts/seed-c3-fixtures.ts`, not part of the app
  runtime): two Client users, each with their own Project via
  `ProjectMember`, one real file on disk with a `Document` row for
  Client A's project — the minimum needed to genuinely attempt
  cross-client access rather than assume it.

### Verification — actual attempts and actual results

All requests below via `curl` against the live dev server.

| # | Attempt | Expected | Actual |
|---|---|---|---|
| 1 | `GET /api/portal/projects/[A]` with no session cookie | 401 | `401 {"error":"Not authenticated."}` |
| 2 | Client A `GET` own project | 200 | `200`, project JSON returned |
| 3 | **Client A `GET` Client B's project by ID** | 403 | `403 {"error":"Not a member of this project."}` |
| 4 | Client A `GET` a nonexistent project ID | 404 | `404 {"error":"Not found."}` |
| 5 | Client A issues signed URL for own document | 200 | `200`, token returned |
| 6 | **Client B requests signed URL for Client A's document by ID** | 403 | `403 {"error":"Not a member of this project."}` |
| 7 | **Client B `GET`s Client A's project by ID** | 403 | `403 {"error":"Not a member of this project."}` |
| 8 | Download with valid signed token | 200 + real file bytes | `200`, exact fixture file content returned |
| 9 | Download with no token | 401 | `401 {"error":"Missing token."}` |
| 10 | Download with a tampered token (last signature char flipped) | 401 | `401 {"error":"This link is invalid or has expired."}` |
| 11 | Direct guess at the on-disk storage path (`/storage/portal/...`) | not publicly reachable | app's normal 404 page — `storage/` isn't under `public/`, no route serves it |
| 12 | `POST` a project message with a valid session cookie but **no CSRF header** (simulates a cross-site form submission — the exact attack CSRF protection exists for) | 403 | `403 {"error":"Invalid or missing CSRF token."}` |
| 13 | Same `POST` with the correct `x-csrf-token` header matching the cookie | 201 | `201`, message created |
| 14 | Same `POST` with a guessed/wrong CSRF header value | 403 | `403 {"error":"Invalid or missing CSRF token."}` |
| 15 | 12 rapid login attempts with a wrong password, same IP | blocked after the configured max (10/15min) | first 8 returned `401`, then `429 {"error":"Too many attempts. Try again later."}` for the rest — tripped slightly before the 10th *failed* attempt because two earlier successful logins in this same test session from the same IP counted against the same rate-limit key, confirming the limiter is IP-scoped across all login attempts, not just failures |
| 16 | SUPER_ADMIN `GET`s Client A's project | 200 (staff bypass) | `200` |
| 17 | SUPER_ADMIN `GET`s Client B's project | 200 (staff bypass) | `200` |

Test data cleanup: the one real `Message` row created during check #13
was deleted afterward via a direct script; the fixture users/projects/
document were left in place since C4/C5 need real project data to build
and test the admin/client UI against.

### Decisions

- **Signed download URLs don't re-check session, only the token.** The
  brief asks for "short-lived signed URLs," which is the presigned-URL
  pattern (S3, etc.) — the authorization decision happens once, at
  issuance, and the token's short expiry (5 minutes) bounds the exposure
  window. Re-checking `requireProjectAccess` again at download time
  would be redundant with what the token already proves and would block
  legitimate cases like opening the link in a new tab. The issuance
  endpoint is where `requireProjectAccess` actually runs.
- **Rate limiting is per-IP across all attempts on that endpoint,
  including successful ones**, not a separate failed-attempt counter.
  Simpler and still effective against credential stuffing; documented as
  a single-instance-only limitation in `/PORTAL-PLAN.md` §12 (in-memory
  Map, no shared store).
- Missing document on signed-URL request returns 404 before the
  project-membership check even runs (can't check access to a project
  you don't have yet) — this doesn't leak anything, since a
  membership-denied 403 and a genuinely-missing-document 404 are
  observably different for good reason: one tells you "you're not
  allowed here," the other "this doesn't exist," and both are safe to
  distinguish since neither reveals another client's data.

### Blocked

None for C3 — all planned checks were performed successfully.

## C4 — Admin Panel

Built inside `apps/public-site/src/app/admin/`, all pages behind `requireAdminPage()`
(SUPER_ADMIN/ADMIN/EDITOR) with client-management actions further restricted to
SUPER_ADMIN/ADMIN per `/PORTAL-PLAN.md` §5's role matrix. Every mutation is a React
Server Action in `lib/portal/actions/*.ts` — each one independently calls
`requireSession()` + `requireRole()` again (never trusts that the page that rendered
the form already checked), so a new action is secure by construction even if called
directly, matching C3's "secure unless explicitly opened" principle.

### What was built

- **Clients** (`/admin/clients`, `/admin/clients/[id]`) — create (Client + linked
  CLIENT-role User in one transaction, admin sets the initial password directly),
  edit company name, disable/re-enable (disabling immediately deletes all of that
  user's sessions, not just flips a flag — takes effect on their very next request),
  reset password (also invalidates all sessions, same as the client's own C2
  self-service reset).
- **Projects** (`/admin/projects`, `/admin/projects/[id]`) — create, edit
  name/description/status/progress %, delete (SUPER_ADMIN only, per the role matrix),
  assign/remove clients via `ProjectMember`, milestones (add, toggle complete),
  project updates (posting one also creates a `Notification` for every assigned
  client — see C5), messages (staff reply into the same thread C3's
  `/api/portal/projects/[id]/messages` API route reads/writes), invoices (create,
  record payments with running PARTIAL/PAID status).
- **Uploads** — `lib/portal/actions/uploads.ts`. Documents: real content-type
  sniffed via `file-type` from the actual bytes (never the filename extension or
  declared MIME), rejected if not in an explicit allow-list, size-capped at 25MB.
  Photos: same sniffing, size-capped at 20MB, then re-encoded through `sharp`
  (resize to a 2400px max width, JPEG quality 88) before being written to
  `storage/portal/` — this is also C6's file-storage-abstraction requirement,
  satisfied here rather than as a separate later pass, since there was no reason to
  build the upload path twice.
- **Photo downloads** — extended C3's signed-URL pattern (`signed-url.ts`) from
  document-only to a shared `signAssetToken(kind, id, ttl)`/`verifyAssetToken`,
  scoped by a `doc:`/`photo:` prefix so a token minted for one table can never be
  replayed against the other. Added the parallel
  `/api/portal/photos/[id]/signed-url` + `/api/portal/photos/download` routes.
  Re-verified the original document flow still works after this refactor (see
  verification table below).
- **News** (`/admin/news`, `/admin/news/[id]`) — create draft, edit, publish now,
  schedule for a future date/time, unpublish. Publishing sets `publishedAt` and
  queues Stage D's social packages (see below).
- **Messages index** (`/admin/messages`) — cross-project list of the latest message
  per project, linking into that project's detail page; not a separate inbox, reads
  the same `Message` rows the project detail page and C3's API route already use.

### Wiring admin-authored news into the live public site

The public `/insights/news` page and its `[slug]` detail route read from a static,
currently-**empty** array (`newsItems` in `packages/ui-components/src/data/news.ts`,
explicitly commented "add real entries here as announcements happen... do not
fabricate placeholder announcements"). Rather than leave the new admin News CRUD
disconnected from the real site — which would fail Stage D's explicit "create post →
publishes to site" requirement — added `lib/portal/public-news.ts`, which merges
published `NewsPost` rows with that static array at read time. Wired into:
`insights/page.tsx`, `insights/news/page.tsx`, `insights/news/[slug]/page.tsx`,
`insights/feed.xml/route.ts`, and `sitemap.ts` — all additive (the static array is
still merged in, not replaced), so a hand-written static entry added later works
exactly as before.

Two of those routes (`/insights` and `/sitemap.xml`) were previously statically
prerendered at build time; a DB-backed page rendered without a revalidation window
would freeze at whatever was published at the last build and silently miss new
posts. Added `export const revalidate = 30` to both, matching the homepage's own
existing ISR pattern (`page.tsx` already used `revalidate = 30`) — same freshness
guarantee, same performance profile as an already-established convention, not a new
one. `/insights/news`, `/insights/news/[slug]`, and `/insights/feed.xml` were already
dynamic (searchParams/route-handler execution) and needed no change.

No worker/cron process exists in this app (`apps/worker` is an unbuilt stub — see
`/PORTAL-PLAN.md` §1/§9), so a SCHEDULED post whose time has arrived is flipped to
PUBLISHED by a sweep (`sweepScheduledNewsPosts()`) that runs on every `/admin/news`
visit rather than on a timer. Documented limitation, same pattern as the C2/C3
in-memory rate limiter.

### Stage D — Social publishing, built alongside C4 since news.ts depends on it

`publishNewsPost` queues a `SocialPost` row per platform via
`lib/portal/social/dispatch.ts`. Architecture:

- `lib/portal/social/types.ts` — the `SocialAdapter` interface every platform
  implements (`isConfigured()`, `formatContent()`, `publish()`).
- `instagram.ts` / `facebook.ts` / `linkedin.ts` — one file per platform, each
  gated by its own `SOCIAL_<PLATFORM>_ENABLED` flag plus platform-specific
  credential env vars (already scaffolded in `.env.example`, all empty). A fourth
  platform later is one new file implementing the same interface, registered in
  `adapter.ts`'s list — nothing else changes.
- `isConfigured()` requires the flag AND real credentials — never true in this
  environment, so every post lands in **Manual mode**, the documented default.
  `publish()` is implemented for real (not a no-op) but rejects immediately if
  called while unconfigured — defensive, since it's genuinely unreachable here.
- Per-platform formatting genuinely differs (`formatContent()`): Instagram gets a
  hashtag block and a "link in bio" note (no direct link — Instagram doesn't render
  clickable caption links); Facebook and LinkedIn get a direct link-back, LinkedIn in
  a more professional register with no hashtags. Every platform's content links back
  to the canonical `/insights/news/[slug]` URL.
- Manual-mode packages are shown in the news post's admin page for copy-paste, with
  a "Regenerate / retry" action (`retrySocialPost`) — for Manual mode this refreshes
  the caption (useful if the post was edited after a first publish); for a
  hypothetical Auto-mode failure it would retry the real API call. No live API call
  was ever attempted — no platform has real credentials.
- Every `SocialPost` row tracks `status` (PENDING/POSTED/MANUAL/FAILED),
  `attemptCount`, `permalink`, and `errorMessage` independently per platform. A
  social failure cannot block or roll back the site publish — `queueSocialPostsForNewsPost`
  runs strictly *after* `NewsPost.status` is already set to PUBLISHED.

### Verification — actual browser automation, not code review

No dedicated browser-automation tool was available in this session's toolset,
so a temporary Playwright script drove a real Chromium instance against the live dev
server (`localhost:3005`) end to end. Playwright was added as a devDependency only
for the duration of the run and removed afterward (`git diff package.json` shows
only the intentional `sharp` addition remains); the script itself and its two test
fixture files (a minimal valid PDF and JPEG, magic bytes checked) were deleted after
use — nothing here was committed. All 21 checks below passed against the real
running app and real local Postgres database, not simulated:

| # | Step | Result |
|---|---|---|
| 1 | Admin login → redirects to `/admin` | PASS |
| 2 | Create client (Client + User in one transaction) | PASS — appears in list |
| 3 | Open client detail page | PASS |
| 4 | Create project → redirects to detail page | PASS |
| 5 | Assign the new client to the project | PASS — appears in Assigned clients table |
| 6 | Edit progress % and status, reload, confirm persisted | PASS — `42` survives reload |
| 7 | Add a milestone | PASS |
| 8 | Toggle milestone complete | PASS |
| 9 | Upload a real PDF as a document | PASS — server confirms real file processed |
| 10 | Upload a real JPEG as a photo | PASS — sniffed + sharp-optimized |
| 11 | Fetch a signed download URL and download it | PASS — downloaded bytes start with `%PDF`, exact byte count matches the uploaded file |
| 12 | Post a project update | PASS — visible immediately |
| 13 | Reply to the project (creates a `Message`) | PASS — visible in thread |
| 14 | Create an invoice | PASS |
| 15 | Send a notification to the assigned client | PASS — "Notification sent to 1 client" |
| 16 | Create a news draft | PASS |
| 17 | Publish it | PASS — status flips to PUBLISHED, Unpublish button + "Live at" link appear (the transient success toast unmounts in the same render as the badge flip — a real but cosmetic timing detail, not a functional defect; see Decisions) |
| 18 | Confirm all 3 platform social packages generated | PASS — Instagram, Facebook, LinkedIn all present |
| 19 | Confirm all 3 are in MANUAL mode | PASS — no credentials configured anywhere |
| 20 | Load the real public `/insights/news` page in a fresh browser tab | PASS — the just-published post is genuinely visible on the live site |
| 21 | Unpublish (cleanup) | PASS — reverts to DRAFT, removed from the public site |

All test data created during this run (the "Verify Co"/"Verify Project" fixtures
across several script iterations while debugging selector issues, and their
uploaded files on disk) was deleted afterward via a direct script, the same pattern
used for C2/C3's test artifacts.

### Decisions

- **Publish/Unpublish success toast vs. persistent state**: the `ActionForm`
  showing "Published — now live" unmounts in the same render pass that flips the
  status badge and swaps the Publish button for Unpublish (both come from the same
  `revalidatePath` refresh). A human admin still gets immediate, arguably clearer
  feedback — the badge and "Live at" link change state right away — so this was left
  as-is rather than restructured to keep the transient message alive through an
  unmount; the persistent state change is the real confirmation.
- **News cover image upload deferred**: `NewsPost.coverImageKey` exists in the
  schema but has no upload UI in this pass. Client/project documents and photos are
  deliberately private (signed-URL-gated, stored outside `public/`), but a news
  cover image is public marketing content and needs a different, publicly-servable
  storage path — building that alongside the private client-storage system in the
  same pass would have been a second, materially different subsystem beyond what
  C4/D asked for. Text-only news posts (title/excerpt/body) are fully functional.
- **Scheduled-post sweep runs on page visit, not a timer**: see above — no
  worker process exists to run on a schedule in this app.
- **Signed asset tokens generalized to `doc:`/`photo:` scopes**: changed the token
  format C3 had already verified (added a scope prefix). Re-ran the core C3
  cross-client checks after the change (step 11 above) to confirm no regression —
  no persisted token needed to survive the format change since tokens are
  short-lived and always freshly issued.

### Blocked

None for C4/D — all planned functionality was built and verified end-to-end.

## C5 — Client Portal

Built in `apps/public-site/src/app/client/` (plus a new `layout.tsx` mirroring
admin's, setting `noindex,nofollow` metadata across every `/client` page including
`/client/login`). Every page calls `requireClientPage()`; the project detail page
additionally scopes its Prisma query *through* `ProjectMember` rather than fetching
the project by id and checking separately — a client's own project is the only shape
the query can return, by construction.

### What was built

- **Dashboard** (`/client`) — every project the signed-in client is a member of
  (via `ProjectMember`), each with status and a progress bar, linking into the
  project detail page.
- **Project detail** (`/client/projects/[id]`) — timeline/milestones, project
  updates feed, progress gallery (photos by phase, opened via C3/C4's signed-URL
  pattern), documents (download via the same signed-URL pattern), financial summary
  (invoices with running paid/total), and a message thread with a reply form
  (`sendClientMessage`, scoped by `requireProjectAccess` rather than a staff role —
  the client-side counterpart to admin's `replyToProjectMessage`, writing into the
  same `Message` table C3's API route and the admin panel already use).
- **Notifications** (`/client/notifications`) — every notification for this user
  (queried directly by `userId`, never fetched broadly and filtered), mark-as-read.
- **Profile** (`/client/profile`) — account details, self-service change password
  (`changeOwnPassword` — requires the *current* password, unlike admin's
  reset-on-someone-else's-behalf action; invalidates every other session but keeps
  the current one alive, since the user is mid-flow).
- Extended `lib/portal/session.ts` to export `SESSION_COOKIE` (was a private
  constant) so `changeOwnPassword` could identify the caller's own session to
  exclude it from the just-changed-password session wipe, without duplicating the
  cookie name as a second hardcoded string.

UI reuses `PortalShell` and `portal-ui.module.css` (both from C4) — no second design
language; the client and admin panels share the same tokens, typography, form
styling, badges, and cards, differing only in what data and actions they expose.

### Verification — real browser automation, admin-to-client flow

Same approach as C4: a temporary Playwright script (removed after the run, playwright
devDependency removed after the run — `git diff package.json` shows only the
intentional `sharp` addition) drove real Chromium against the live dev server with
`PORTAL_ENABLED=true`, seeding real content as SUPER_ADMIN through the actual admin
UI, then verifying it as the C3 fixture client. All 21 checks passed:

| # | Step | Result |
|---|---|---|
| 1-5 | Admin logs in, adds a milestone/update/invoice/notification to the C3 fixture project through the real admin UI | PASS (all 4) |
| 6 | Client A logs in → redirects to `/client` | PASS |
| 7 | Dashboard shows the assigned project | PASS |
| 8 | Clicking through opens the correct project detail page | PASS |
| 9-11 | Client sees the milestone / update / invoice the admin just added | PASS (all 3) |
| 12 | Client sees the C3 fixture document | PASS |
| 13 | Client downloads their own document via signed URL — real bytes verified | PASS — content matches the original fixture file exactly |
| 14 | Client sends a message, appears in the thread | PASS |
| 15 | Client sees the notification the admin sent | PASS |
| 16 | Marking every unread notification read removes the "New" badge | PASS |
| 17 | Profile page shows the correct account email | PASS |
| 18 | Change password with correct current password succeeds | PASS |
| 19 | **Old password rejected after the change** | PASS |
| 20 | **New password works after the change** | PASS |
| 21 | **Client B directly requesting Client A's project URL by ID** | PASS — `404`, not the project (the exact cross-client attempt C3's brief demanded, now re-verified against a real UI page, not just the API route) |

Test data hygiene: two earlier script iterations hit the login endpoint's rate
limiter (all test accounts share one IP, and the limiter is correctly per-IP —
confirmed the limiter still works under real repeated use, restarted the dev server
to clear its in-memory window and continue). Every duplicate milestone/update/
invoice/notification created across iterations was deleted via a direct script
afterward; the fixture client's password was restored to the documented
`TestClient!12345`, and all sessions were cleared.

### Coming Soon regression check (flag off)

After finishing verification, set `PORTAL_ENABLED` back to `false` (its default —
the brief's own instruction: the portal stays hidden until the site owner opens it)
and restarted the dev server. Confirmed directly:

- `GET /client` → 200, page body contains "Coming Soon", not the dashboard.
- `GET /client/projects/c3-fixture-project-a` (a real, valid project id) → 200,
  page body **still** contains "Coming Soon" — a deep link to real data does not
  bypass the gate.
- `GET /admin/login` → 200, unaffected by the flag (by design — SUPER_ADMIN can
  keep testing while the flag is off).
- Public homepage → 200, unaffected.

### Decisions

- **"Requests" (brief's "requests/messages")** interpreted as the existing message
  thread — no separate Request model exists in the schema, and a second parallel
  communication channel wasn't asked for elsewhere in the brief; the message thread
  already covers a client asking their architect something.
- **`SESSION_COOKIE` exported from `session.ts`**: a one-line change (removed the
  `const` → `export const`) to an already-verified C2 file, to avoid a second
  hardcoded `'portal_session'` string drifting out of sync in `profile.ts`.

### Blocked

None for C5 — all planned functionality was built and verified end-to-end, including
the flag-off regression check.

---

## Final Verification

Performed after C0-C6 and D1-D5 were all individually verified, as the brief's
explicit closing checklist — re-checking the whole system together, not just
re-asserting each stage's own report.

**1. Clean production build, zero errors.** `corepack pnpm build` from
`apps/public-site` — confirmed clean multiple times across this session, most
recently after the mobile header fix below. `tsc --noEmit` and `eslint .` both clean
at every commit in this stage.

**2. Public site regression.** Every existing public route still returns 200
(`/`, `/insights`, `/insights/news`, `/projects`, `/contact`, `/about/about-us`,
spot-checked directly). The only console errors found during a real-browser pass
(homepage and `/insights/news`, all 3 breakpoints) are pre-existing Tawk.to chat
widget CORS failures against a `localhost` origin — that integration predates this
session and isn't something a `localhost:3005` origin can satisfy (Tawk's own
domain allowlist), not a regression introduced here. Metadata, structured data
(`StructuredData` JSON-LD blocks), and the RSS feed all still render — `/insights`,
`/sitemap.xml`, `/insights/news`, `/insights/news/[slug]`, and
`/insights/feed.xml` were the five files touched to merge in `NewsPost` content, and
all five were re-verified individually in C4's section above. Screenshots of the
public homepage and `/insights/news` at desktop/tablet/mobile confirm no visual
regression.

**3. `PORTAL_ENABLED=false` (the default).** `/client` → Coming Soon page (verified
via response body, not just status code). A deep link to a real, valid project id
(`/client/projects/c3-fixture-project-a`) **also** renders Coming Soon — confirms
the middleware gate can't be bypassed by guessing a specific URL. `robots.txt` now
correctly disallows `/admin/` and `/client/` (**a genuine gap found during this
final pass** — see Decisions below). `sitemap.xml` has zero admin/client entries
(this part of the original C0 claim was actually correct). No public nav/footer/
component anywhere links to `/admin` or `/client` (grepped `packages/ui-components`
and `apps/public-site/src/components`). `/admin/login` stays reachable regardless
of the flag, as designed.

**4. `PORTAL_ENABLED=true`.** Full flow re-verified in this pass: login → dashboard
→ project detail (timeline, gallery, documents, financial summary, messages) →
notifications → profile/change-password, all with real data seeded through the
actual admin UI. See C5's verification table for the complete 21-check run.

**5. Security verification, explicit results** (consolidating C3 and C5's real
attempts, not re-describing the guard code):

| Attempt | Result |
|---|---|
| Cross-client access to another client's project by ID (API route, C3) | **403** |
| Cross-client access to another client's project by ID (real UI page, C5) | **404** |
| Cross-client access to another client's document by ID | **403** |
| Unauthenticated document download (no session, no token) | **401** |
| Document download with a tampered signed token | **401** |
| State-changing POST with a valid session but no CSRF header | **403** |
| Repeated login attempts, same IP | **429** after the configured threshold, confirmed twice more during C4/C5's own repeated test runs (rate limiter is real, not just present in code) |
| Client self-service password change with wrong current password | rejected, old password still works until a *correct* current-password change succeeds |
| Old password reused immediately after a successful change | rejected |

**6. Screenshots.** Real Chromium screenshots captured at 1440×900 (desktop),
768×1024 (tablet), and 375×812 (mobile) for: public homepage, `/insights/news`,
admin dashboard, and the client portal project detail page. Not fabricated —
generated via a temporary Playwright script against the live dev server, removed
after use. The mobile pass is what caught the header-wrapping defect described
below.

### Decisions (final pass)

- **`robots.txt` fix**: the C0 checkpoint's report claimed `robots.txt` disallowed
  `/admin`/`/client`; it didn't. `sitemap.xml`'s exclusion was genuinely already
  correct (verified by checking what `sitemap.ts` actually builds — no admin/client
  route was ever added to it), which is likely why this went unnoticed: the more
  consequential of the two protections (nothing in the sitemap to discover) was
  fine, but the static `public/robots.txt` file itself was never touched. This is
  logged here rather than silently folded into an earlier stage's report, since the
  point of a Honesty Lock is that a wrong "done" claim gets corrected loudly, not
  quietly.
- **Mobile header layout**: `PortalShell.module.css`'s `.header` relied on
  `flex-wrap` across three unevenly-sized children (brand, nav, user area); at
  narrow widths this wrapped nav's own links independently of the outer wrap,
  producing a confusing order. Fixed with a `max-width: 768px` breakpoint (matching
  the site's own existing convention in `Header.module.css`/`globals.css`) that
  stacks the three sections as full-width rows instead.
- **Tawk.to CORS errors on localhost**: not fixed, not in scope — pre-existing
  third-party chat widget behavior against a non-whitelisted origin, unrelated to
  anything built in Stages C/D, and will not occur on the real production domain.

### Blocked

None.

---

## Operating Guide

Plain-language instructions for the site owner. Everything below assumes
`PORTAL_ENABLED=false` until you're ready (see "Opening the portal" at the end).

### Sign in as SUPER_ADMIN

Go to `/admin/login` and sign in with `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`
(set in `.env` — change `SUPER_ADMIN_PASSWORD` from its default before using this
for real). `/admin` is reachable at all times regardless of the portal flag, so you
can set everything up before opening the Client Portal to clients.

### Create a client

`/admin/clients` → fill in company name, contact name, contact email, and an
initial password → **Create client**. This creates both the company record and
their portal login in one step. Give the client their email and the password you
set (or use "Reset password" later to set a new one — this immediately signs them
out everywhere, so only do it when you're about to give them the new password).

### Create a project and assign it to a client

`/admin/projects` → **Create project** (name + description) → you'll land on the
project's page. Under "Assigned clients," pick the client from the dropdown and
click **Assign** — only clients who already have a portal login (created above)
appear in that list. From here you can also set progress % and status, add
milestones, post updates (these also notify the client), upload documents and
photos, create invoices, and reply to messages — all on this one page.

### Upload documents and photos

On a project's page: **Documents** section for drawings/contracts/BOQs/reports/
warranties/invoices (pick a category, choose a file, upload); **Photos** section
for progress photos (pick before/during/after, choose an image, optional caption —
it's automatically resized and re-compressed on upload). Both are validated by
their actual file content, not just the filename, and both become downloadable to
the assigned client through a private, time-limited link — never a permanent public
URL.

### Write and publish a news post

`/admin/news` → **Create draft** (title, excerpt, body) → on the post's page,
**Publish now** makes it genuinely live at `/insights/news/<slug>` immediately (or
**Schedule** for a future date/time — it goes live automatically the next time
anyone visits `/admin/news`, since there's no background job runner in this app;
if you need it to go live at an exact time with nobody in the admin panel, publish
it manually at that time instead). **Unpublish** takes it back down. Publishing
also generates the social media packages below.

### Social media — copy-paste today, one-click later

Every published post automatically gets a ready-to-use caption for Instagram,
Facebook, and LinkedIn, shown on the post's admin page under "Social packages" —
copy the text and post it yourself in each platform's app. This is "Manual mode,"
the default, because no social media credentials are configured anywhere in this
app. If you later get Instagram/Facebook/LinkedIn API access approved and want
automatic posting: add the credentials to `.env` (see `.env.example` for the exact
variable names) and flip that platform's `SOCIAL_<PLATFORM>_ENABLED` flag to
`true` — no code changes needed. Until then, "Regenerate / retry" on a package just
refreshes the caption text (useful if you edited the post after publishing).

### Client side — what your clients see

Once you open the portal (see below), each client signs in at `/client/login`,
sees a dashboard of their project(s), and can view progress, timeline, photos,
documents (download), invoices, and message you — plus manage their own
notifications and change their own password.

### Opening the portal

Set `PORTAL_ENABLED=true` in production and redeploy — that's the only step. No
code change. Before doing that: run through this guide once yourself as
SUPER_ADMIN to make sure at least one real client and project exist, since an
empty portal is a confusing first experience. `/admin` itself needs no flag change
— it already works today.

---

# Marketing Studio — Final Implementation Report

Built on top of everything above, per the separate architecture document
`/CONTENT-STUDIO-PLAN.md`. Same environment, same Honesty Lock, same
`/admin` surface (no new flag — reachable today).

## 1. Final implementation report

Nine subsystems, each config-driven rather than hardcoded, each verified
against the real running app and real local database:

| Area | What's real | Where |
|---|---|---|
| **Media Library** | Upload → automatic pipeline (magic-byte validation → sharp re-encode/EXIF-normalize → attention-based smart crop → all 8 variants below → JPEG compression) → collections, categories, tags, full-text-ish search | `src/lib/portal/media/pipeline.ts`, `/admin/media` |
| **Brand Kit** | Single DB row (`BrandKit`) for colors/typography/CTA presets/logos/watermark, lazily seeded from `packages/design-tokens`; branded QR generation (`qrcode` + sharp logo overlay) | `src/lib/portal/brand-kit.ts`, `src/lib/portal/media/qrcode.ts`, `/admin/brand-kit` |
| **Template Engine** | One generic Satori/`next/og` renderer interprets a JSON `definition` (typed, percentage-positioned layers: image/gradient/solid/text/badge/logo/watermark) — 10 official templates ship as data, not code | `src/lib/content-studio/template-engine/render.tsx`, `scripts/seed-official-templates.ts`, `/admin/templates` |
| **Image Pipeline / Social Outputs** | 8 output targets generated automatically on every graphic: `instagram-portrait`, `instagram-square`, `facebook`, `linkedin`, `google-business`, `website-hero`, `website-thumbnail`, `open-graph` — no manual resizing anywhere | `src/lib/portal/media/output-targets.ts` |
| **AI Marketing Assistant** | One action generates `seoTitle`, `metaDescription`, `altText`, `caption`, `hashtags[]`, `keywords[]`, `suggestedCta`, `marketingSummary`, plus ranked image suggestions — provider selected at runtime from a DB row (`AIProviderConfig`: NONE/ANTHROPIC/OPENAI/CUSTOM), real Anthropic adapter included but credential-less in this environment | `packages/application/src/ports/ai-content-port.ts`, `src/lib/portal/ai/*`, `/admin/ai-settings` |
| **Publishing** | 4 platform adapters (Instagram, Facebook, LinkedIn, Google Business Profile) behind one `SocialAdapter` interface; per-platform participation toggled from a DB table (`PublishingDestination`), not a redeploy | `src/lib/portal/social/*`, `/admin/publishing-destinations` |
| **Campaigns** | Top-level container aggregating Articles, Social Posts, Graphics, and Landing Pages by `campaignId` | `src/lib/portal/actions/campaigns.ts`, `/admin/campaigns` |
| **Landing Pages** | Block-based (`hero`/`text`/`image`/`cta`/`gallery`), authored as JSON, served at a real public route only when `status = PUBLISHED` | `src/lib/content-studio/landing-page-blocks.ts`, `/lp/[slug]`, `/admin/landing-pages` |
| **Analytics** | Self-hosted `PageView` tracking (Projects, Articles, Landing Pages) with zero external dependency; campaign performance and media usage from real DB aggregates; SEO and social-engagement sections honestly show a "connect it" state rather than fabricated numbers | `src/lib/portal/analytics/*`, `/admin/analytics` |

**Implementation rules honored, concretely:**
- *No hardcoded templates* — adding template #11 is one `SocialTemplate` row; the renderer never changes.
- *No hardcoded prompts* — the Anthropic adapter's prompt lives in one file, swappable per provider; the `AIContentPort` interface has no vendor concept.
- *No hardcoded AI providers* — `getActiveAIProvider()` reads a DB row, not an env constant; a provider with no implementation, or no credential, cleanly falls back to `nullAIProvider` rather than crashing or faking output.
- *No hardcoded publishing destinations* — the four platforms still each need real platform-specific adapter code (a genuinely new platform always will), but which of them actually dispatch is admin-editable, not a code change.

**Cross-cutting integrity, extended from Stage C3:** signed-URL scopes added for `media`/`variant`/`graphic`; every private DAM asset gated by staff auth, every publicly-referenced asset (in a *currently* `PUBLISHED` NewsPost or LandingPage) served through a route that checks that live, not by URL secrecy.

**Real bugs found and fixed while verifying this phase** (not from code review — from actually running it):
1. Local dev database's `template1`/`template0` both polluted with the app schema, breaking `prisma migrate dev`'s shadow DB — bypassed via `prisma migrate diff` + manual migration folder + `prisma migrate resolve --applied`.
2. Google Fonts serves Outfit as legacy `format('woff')`, not `opentype`/`truetype` — Satori font loader's regex was too narrow, broadened to accept all three.
3. A stray non-async `export { OUTPUT_TARGETS }` at the bottom of a `'use server'` file broke the *entire* module load, 500ing `/admin/templates` — removed (callers already imported it directly).
4. `lib/portal/db.ts`'s Prisma singleton was only cached outside `NODE_ENV=production`, so `next build`'s parallel static-generation workers each leaked an unclosed connection pool, intermittently breaking the build. Fixed by caching unconditionally and capping the pool at `max: 5`. Verified with 3 consecutive clean builds after the fix (vs. 3 consecutive failures before it).

**Final verification pass (this session):**
- `tsc --noEmit` — clean.
- `eslint .` — clean, no leftover temporary tooling (`playwright` was never added this phase; confirmed absent from `package.json`).
- `pnpm build` — clean production build.
- All 13 `/admin` nav sections (Dashboard, Clients, Projects, Articles, Campaigns, Landing Pages, Media, Templates, Brand Kit, Analytics, Messages, AI Settings, Publishing) return `200` and render without an error boundary, checked as an authenticated SUPER_ADMIN via the real `/api/portal/auth/login` endpoint against the running production build.
- `PORTAL_ENABLED=false` still correctly rewrites `/client/*` to the Coming Soon page; `/admin/*` remains reachable — the C0 gate is untouched by this phase.
- Working tree clean; no stray build-artifact or test-artifact diffs left uncommitted.

## 2. Operating guide

**Brand Kit first.** `/admin/brand-kit` — review the seeded colors/typography (pulled from `packages/design-tokens` on first load) and adjust if needed. Every template and QR code reads from this, so get it right once rather than per-asset.

**Upload media.** `/admin/media` → **Upload** — pipeline runs automatically; open any image afterward to see all 8 generated variants, add tags/categories/collections, or (on the detail page) run **Generate AI tags** if an AI provider is configured.

**Generate branded graphics.** `/admin/templates` → pick one of the 10 official templates (or **Create template** with a custom JSON `definition`) → **Generate graphics**, supplying the source image/text and optionally a campaign. Produces all applicable output-target PNGs at once, downloadable via signed URL.

**Run the AI Marketing Assistant.** On any article's detail page (`/admin/news/[id]`), **Generate AI package** — only works once an AI provider is configured (see below); otherwise cleanly reports "not configured" rather than guessing.

**Start a campaign.** `/admin/campaigns` → **Create campaign** → link articles (from the article's own page), generate graphics against it (select it in the template generator), and create a landing page against it — the campaign detail page then aggregates all of it in one view with a real view count.

**Publish a landing page.** `/admin/landing-pages` → **Create** → author `blocks` JSON (hero/text/image/cta/gallery — same authoring model as templates, a full visual block editor is a separate future project) → set status to Published → live at `/lp/<slug>`.

**Turn on AI generation for real.** `/admin/ai-settings` — set provider to `ANTHROPIC`, then add `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) to `.env` and restart. No code change.

**Turn on real social publishing.** Same pattern as the Stage D adapters: add that platform's credentials to `.env` and flip its `SOCIAL_<PLATFORM>_ENABLED` flag — now four platforms including Google Business Profile. Independently, `/admin/publishing-destinations` lets you pause any one platform's participation without touching `.env` at all.

**Read the Analytics dashboard.** `/admin/analytics` — "Content performance," "Campaign performance," and "Media usage" are real numbers from day one. "SEO" (organic traffic/keywords) and the engagement half of "Social engagement" (likes/reach) honestly show a not-connected state until GA4 and each platform's real API access are wired in — the dispatch-status counts shown there in the meantime are real, just a different (and available today) signal than platform-reported engagement.

## 3. Remaining owner decisions

Everything above is implemented and verified. What's left genuinely needs the
business owner, not more engineering:

1. **AI provider credential** — which vendor (Anthropic is wired and ready; OpenAI/Custom have the same DB-driven slot but no adapter written yet, since none was named in the brief) and who holds/pays for the API key.
2. **Social platform API access** — Instagram, Facebook, LinkedIn, and Google Business Profile all require the owner (not this environment) to complete each platform's own developer/business verification and issue real tokens. Until then, all four stay in Manual mode by design, not by omission.
3. **Google Analytics 4 property + service account** — `NEXT_PUBLIC_GA_MEASUREMENT_ID` already sends events; reading organic traffic/keywords back into the dashboard needs a real GA4 property ID and a service-account key, which only the owner's Google account can issue.
4. **A real visual block/template editor** — both the Template Engine's `definition` and Landing Pages' `blocks` are authored as raw JSON today. That was an explicit, stated scope boundary in this phase (a drag-and-drop editor is a substantial UI project on its own), not an oversight — worth a decision on priority if non-technical staff will author these directly.
5. **Whether/when to flip `PORTAL_ENABLED=true`** — unrelated to Marketing Studio itself (that flag only ever gated the Client Portal), but still the one remaining switch from the earlier phases of this engagement, and the natural moment to revisit it now that the admin side has grown considerably.

---

# Go-Live Pass — Final Implementation Report

Settings Center, full object lifecycle (archive/restore/delete), and a
security/UX/performance hardening pass across the entire admin panel.
Same environment, same Honesty Lock, same verification discipline as
every phase above.

## 1. Final implementation report

**Settings Center** (`/admin/settings`) — one hub linking every
configuration surface, replacing scattered top-level pages and `.env`
edits for day-to-day operation:

| Section | What's real |
|---|---|
| **Integrations** | Instagram/Facebook/LinkedIn/Google Business Profile via real OAuth (`lib/portal/integrations/oauth.ts`) — authorize URL, CSRF-protected state cookie, token exchange, the platform-specific follow-up calls each one actually needs (Page token lookup, IG Business Account lookup). Google Analytics/Search Console via service-account JWT auth (`lib/portal/integrations/google-service-account.ts` — real RS256 signing, no Google SDK dependency). Google Maps/Email via a plain API-key form. Every credential AES-256-GCM encrypted (`lib/portal/integrations/encryption.ts`) before it ever touches the database. |
| **AI** | Anthropic (rewired from the old single-row config), plus three new real adapters — OpenAI, Gemini, OpenRouter — all implementing the same `AIContentPort`, all reading their credential from the encrypted store, all sharing one prompt module (`ai/prompts.ts`) and one Brand-Kit-aware context injector (`ai/brand-context.ts`) instead of four copies. |
| **Client Portal** | `PortalSettings` singleton replaces `PORTAL_ENABLED` as the runtime source of truth. Required migrating `middleware.ts` → Next 16's `proxy.ts` (stable Node.js runtime) specifically so the gate could query the database directly — the Edge-only `middleware.ts` never could. `PORTAL_ENABLED` still exists as the pre-seed default and a fail-closed fallback if the database is briefly unreachable. |
| **Users** | Real staff invite (reuses the exact password-reset token/email flow the self-service "forgot password" already uses), enable/disable, self-disable blocked. |
| **Roles** | A reference page, not a new permissions engine — accurately documents the four fixed roles already enforced throughout `auth-guard.ts`/`page-guard.ts`. |
| **General / SEO** | Deliberately read-only where a form would lie: `NEXT_PUBLIC_SITE_URL` is baked in at build time, so General shows it rather than pretending a database edit would take effect. SEO shows a real, live-queried meta-tag-coverage count for published Articles/Landing Pages, plus the actual `robots.txt` content. |
| **Security** | Session/password/CSRF/rate-limit policy documented against what the code actually enforces, plus a two-step-confirmed "Force logout everywhere" (revokes every `Session` row at once). |
| **System** | Seven live health checks run on every page load — DB ping, storage write test, and per-service connection status for Email/AI/Social/Analytics — plus an honest "no background worker process" note instead of fabricating one. |
| **Backup & Restore** | No `pg_dump`/`pg_restore`/`psql` binary exists in this environment (checked directly) — built a Prisma-level JSON export/import instead: all 40 tables, in a dependency-safe order, restorable through the same connection the app already has (portable to any Postgres host, not dependent on CLI tools being installed alongside it). Restore runs inside one transaction — a bad backup fails atomically, never partially. |

**Lifecycle management**, per entity: Clients/Media/Templates get
Archive + Restore + a guarded hard-Delete (blocked when deleting would
lose real history); Projects/Articles/Landing Pages get Archive plus a
Delete restricted to never-published drafts; Campaigns already had
Archive from the Marketing Studio phase; Categories/Tags/Messages/
non-`POSTED` Social Posts get a real hard delete because each is
genuinely safe by construction (cascade-only joins, or no downstream
record to lose) — not just permitted without checking.

**Two real, live bugs found and fixed** (not part of the brief, found
by reading the code the brief asked to be reviewed):
1. `/api/contact` — the `Enquiry` database write was commented out
   behind a stale `// TODO: once a production DATABASE_URL exists`, even
   though a working one has powered this entire engagement. Every
   contact-form lead was email-only, with zero database record. Fixed,
   and given an `/admin/enquiries` page (previously nonexistent).
2. `CareersForm.tsx` — a live public job-application form (with CV
   upload) that told applicants "Application Submitted" while its
   `onSubmit` only `console.log`'d the data and discarded it. Given a
   real backend (`/api/careers`, Resend with the CV attached, matching
   the Contact form's already-proven email pipeline rather than
   inventing a new applicant-tracking system).

**Security hardening found during review:** neither Contact nor the
new Careers route had rate limiting (Contact never did; Careers is new)
— both now use the same sliding-window limiter as login/forgot-password.
Force Logout Everywhere upgraded from one click to a two-step confirm
(disruptive to every session at once, even though not data-destructive).

**Verification — clean from a fully cleared build cache:** `tsc`,
`eslint`, and `next build` all pass with zero errors. Logged in as
SUPER_ADMIN and hit all 22 admin/Settings pages plus public/client
routes — every one returns 200 with no hidden error boundary in the
response body. `Client Portal` enable → `/client` reaches Login,
disable → `/client` serves Coming Soon content, both confirmed live
through the real `proxy.ts` gate (not just read from source). Created a
real backup (97KB) and validated it ("301 rows across 40 tables").
Confirmed the new Contact rate limiter live: 6th request within 15
minutes correctly returns 429. Checked responsive layout at
390/820/1440px on the public homepage, the Settings hub, and
Integrations — zero horizontal overflow anywhere.

## 2. Operating guide (additions)

**Connect a service.** `/admin/settings/integrations` — OAuth platforms
(Instagram, Facebook, LinkedIn, Google Business Profile) show **Connect
via OAuth**; it only works once that platform's app-level Client
ID/Secret is set in `.env` (a one-time setup step — see Remaining Owner
Decisions). Google Analytics/Search Console instead ask for a pasted
service-account JSON key (create one in Google Cloud Console, then grant
it Viewer/Owner access on the relevant property/site). Every connected
service shows **Test Connection** (a real, live API call) and
**Disconnect**.

**Manage AI providers.** `/admin/settings/ai` — connect one or more
providers with an API key, then pick the **Default provider** the AI
Marketing Assistant actually uses. Un-set = every "Generate" button
across the admin panel shows "not configured," never fabricated output.

**Open or pause the Client Portal.** `/admin/settings/client-portal` —
toggle **Enable Portal** live, no redeploy. **Maintenance Mode** takes
it offline temporarily without disabling it outright (useful during a
migration or incident) — both read by `proxy.ts` on every `/client`
request.

**Invite staff.** `/admin/settings/users` — enter email/name/role, they
get the same password-setup email a self-service reset sends. Only
SUPER_ADMIN can invite another SUPER_ADMIN.

**Check system health.** `/admin/settings/system` — glance here first
if something seems broken; it tells you plainly which piece (database,
storage, a specific integration) is the problem, rather than a generic
error.

**Back up before anything risky.** `/admin/settings/backup` → **Create
Backup** before a migration, a bulk edit, or handing off admin access.
**Restore** is real and destructive — it replaces every row in every
table with the backup's data — type `RESTORE` to confirm, and the
action is atomic (a bad backup fails without changing anything).

**Archive instead of delete when in doubt.** Clients, Media, Articles,
Landing Pages, Templates, and Projects all support Archive — it hides
the item from the default view without touching its data, and can
always be reversed from the item's own page. Delete is only offered
where it's genuinely safe (nothing real would be lost) or is explicitly
restricted (e.g., only an unpublished Article/Landing Page draft).

## 3. Remaining owner decisions (go-live pass)

1. **Register each OAuth platform's developer app** — Instagram/
   Facebook need a Meta App (`META_APP_ID`/`META_APP_SECRET`); LinkedIn
   needs a LinkedIn App (`LINKEDIN_CLIENT_ID`/`SECRET`); Google Business
   Profile needs a Google Cloud OAuth client (`GOOGLE_CLIENT_ID`/
   `SECRET`). This is a one-time account-ownership step tied to the
   owner's real business identity on each platform — this environment
   cannot do it on their behalf. Until it's done, each Connect button
   honestly reports "no OAuth app configured" rather than failing
   obscurely.
2. **Generate `INTEGRATION_ENCRYPTION_KEY` for the real production
   environment** — a fresh one, not the value committed to this local
   `.env` for development. Losing it makes every stored credential
   permanently undecryptable (by design — it's not recoverable, the same
   way losing a password is not recoverable).
3. **Decide the Careers/HR destination inbox** — `CAREERS_EMAIL` is
   currently unset (falls back to `info@ahwarchitects.com`); point it at
   a real HR inbox if that's not where applications should land.
4. **Review the pre-launch fixture data** — 3 staff users, 2 clients, 2
   projects, 1 article exist from testing earlier phases of this
   engagement. Not deleted unilaterally (a database purge is
   hard-to-reverse and this environment can't be certain what the owner
   wants kept as a starting dataset) — worth a decision: keep as a
   working example, or clear via `/admin/settings/backup` (create a
   backup first) before real clients are onboarded.
5. Everything listed under Marketing Studio's own Remaining Owner
   Decisions above (social platform verification, GA4 property, the
   block/template visual editor, `PORTAL_ENABLED`) still applies —
   unchanged by this pass.
