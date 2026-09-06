/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
            "source": "/projects/il-bosco-villa-new-capital",
            "destination": "/projects/il-bosco-villa-new-capital-egypt",
            "permanent": true
      },
      {
            "source": "/projects/sultan-center-hawally",
            "destination": "/projects/sultan-center-hawally-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/khiran-chalet",
            "destination": "/projects/khiran-chalet-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/lawyer-offices-bneid-al-gar",
            "destination": "/projects/aliaa-behbehani-lawyer-office-bneid-al-gar",
            "permanent": true
      },
      {
            "source": "/projects/fintas-apartment",
            "destination": "/projects/fintas-apartment-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/samsung-nasr-city",
            "destination": "/projects/samsung-store-nasr-city-egypt",
            "permanent": true
      },
      {
            "source": "/projects/ahw-hq-zahraa-al-maadi",
            "destination": "/projects/ahw-architects-hq-maadi-egypt",
            "permanent": true
      },
      {
            "source": "/projects/stone-residence-new-cairo",
            "destination": "/projects/stone-residence-new-cairo-egypt",
            "permanent": true
      },
      {
            "source": "/projects/kai-sokhna",
            "destination": "/projects/kai-sokhna-egypt",
            "permanent": true
      },
      {
            "source": "/projects/giorgio-di-mare-avenues",
            "destination": "/projects/giorgio-di-mare-avenues-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/tmreya-kout-mall",
            "destination": "/projects/tmreya-cafe-kout-mall-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/jabria-apartment",
            "destination": "/projects/jabriya-apartment-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/luxury-villa-design-build-al-nozha-kuwait",
            "destination": "/projects/nozha-private-villa-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/new-brew-coffee-salmiya",
            "destination": "/projects/new-brew-coffee-salmiya-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/residential-unit-shrouk",
            "destination": "/projects/shrouk-city-apartment-egypt",
            "permanent": true
      },
      {
            "source": "/projects/stone-park-landscape",
            "destination": "/projects/diyar-park-landscape-new-cairo",
            "permanent": true
      },
      {
            "source": "/projects/stone-park-landscape-new-cairo",
            "destination": "/projects/diyar-park-landscape-new-cairo",
            "permanent": true
      },
      {
            "source": "/projects/al-khawaneej-courtyard-villa-dubai",
            "destination": "/projects/khawaneej-courtyard-villa-dubai",
            "permanent": true
      },
      {
            "source": "/projects/surra-villa",
            "destination": "/projects/surra-villa-kuwait",
            "permanent": true
      },
      {
            "source": "/projects/aurea-social-house",
            "destination": "/projects/aurea-social-house-new-capital-egypt",
            "permanent": true
      }
];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Verified safe before adding: every OAuth flow in this app
          // (Settings/Ads → Integrations) is full-page redirect based, not
          // popup-based — no window.open()/window.opener dependency exists
          // anywhere in the codebase except one already-`noopener` admin
          // download link (AssetDownloadLink.tsx). Tawk chat runs in an
          // iframe, not a cross-origin popup — unaffected by COOP either
          // way. `same-origin` isolates this site's top-level browsing
          // context from any cross-origin popup it might open in the
          // future without breaking anything that exists today.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          {
            key: 'Permissions-Policy',
            // interest-cohort blocked the now-retired FLoC; browsing-topics
            // opts out of Chrome's Topics API (FLoC's replacement) the same
            // way — sites are enrolled by default unless they opt out.
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // cdn.jsdelivr.net added to script-src/style-src per Tawk.to's
              // own documented CSP requirements (help.tawk.to — "Resolving
              // Content Security Policy (CSP) issues blocking the widget") —
              // their widget loads an emoji-picker library (emojione) from
              // there; without it the browser silently blocked the request
              // (confirmed via a live Lighthouse run: "Loading the script
              // 'https://cdn.jsdelivr.net/emojione/...' violates the
              // following Content Security Policy directive: script-src").
              // 'unsafe-eval' removed — tested with it stripped via a live
              // proxy against the production build (home, contact, a
              // project page, and every authenticated /admin surface
              // including Ads, Media, Enquiries): zero eval-related CSP
              // violations anywhere. Nothing in this app (React hydration,
              // gtag.js, Tawk chat, the Admin's own client components)
              // actually calls eval()/new Function() — confirmed by a full
              // codebase search finding none. Lighthouse's csp-xss audit
              // flags 'unsafe-eval' as a real XSS-surface risk; removing an
              // unused grant is a pure hardening with zero functional risk.
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://embed.tawk.to https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to",
              // googleadservices.com/google.com/googleads.g.doubleclick.net
              // added for the Google Ads conversion beacon (gtag
              // 'event','conversion' → pagead/conversion, pagead/1p-conversion,
              // pagead/viewthroughconversion) — confirmed via a real live click
              // that, without these, the browser silently blocked the requests
              // even though gtag() itself fired correctly with no JS error. A
              // country-specific Google domain variant (e.g. google.com.eg) can
              // still get blocked as a redundant secondary ping — not fixed,
              // since the primary www.google.com / googleadservices.com pings
              // above already carry the actual conversion and there's no finite
              // way to allowlist every ccTLD Google might use.
              //
              // analytics.google.com/stats.g.doubleclick.net added for GA4's
              // OWN pageview/event beacons — gtag.js sends its measurement
              // protocol "collect" calls straight to these two origins (not
              // proxied through googletagmanager.com), and without them every
              // single pageview on the site was silently failing to record —
              // confirmed via a live Lighthouse run flagging both as
              // "errors-in-console" and a Chrome DevTools "Issues" CSP entry.
              // This was a real, previously-undiscovered analytics gap, not
              // a cosmetic warning.
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googleadservices.com https://www.google.com https://googleads.g.doubleclick.net https://*.tawk.to wss://*.tawk.to",
              "frame-src 'self' https://www.google.com https://*.tawk.to",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@agp/ui-components', '@agp/design-tokens'],
  // sharp ships a native binary (libvips) per platform. serverExternalPackages
  // alone was NOT sufficient to fix the production error this targets
  // ("Could not load the sharp module using the linux-x64 runtime...
  // libvips-cpp.so.8.18.3: cannot open shared object file") — confirmed by
  // testing it in isolation first, including against a genuinely fresh,
  // uncached `pnpm install` (ruling out a stale build-cache explanation).
  // serverExternalPackages keeps sharp's own require() calls unbundled,
  // but libvips-cpp.so itself is dlopen'd from inside sharp's compiled
  // .node addon — invisible to Next.js's output-file-tracing (@vercel/nft),
  // which only follows statically/dynamically analyzable JS require()/
  // import calls. outputFileTracingIncludes below is what actually forces
  // sharp's full directory (all platform binaries, since @img/sharp-* are
  // separate optional packages) into the deployed function's file set.
  // Every server action importing lib/portal/media/pipeline.ts (which
  // imports sharp) was failing at module-evaluation time — not just
  // uploads, but every other action co-located in the same file (e.g.
  // category/tag management in lib/portal/actions/media.ts), since one
  // throwing top-level import breaks the whole module.
  serverExternalPackages: ['sharp'],
  // A second attempt at this glob (matching against node_modules/sharp and
  // node_modules/@img directly) also failed to fix the "libvips-cpp.so...
  // cannot open shared object file" error in production. Root cause,
  // confirmed by inspecting this project's own pnpm structure: pnpm never
  // installs a package as a real directory at the top of node_modules —
  // `node_modules/sharp` is itself a symlink into node_modules/.pnpm's
  // flat virtual store, and sharp's own dependency on the *separate*
  // @img/sharp-libvips-linux-x64 package (confirmed present in
  // pnpm-lock.yaml — this is the package that actually ships
  // libvips-cpp.so, distinct from @img/sharp-linux-x64's JS bindings) is
  // itself another symlink one level deeper. A glob rooted at
  // node_modules/sharp/**/* only resolves what the FIRST symlink points
  // to; it does not reliably re-resolve a second, nested symlink to a
  // completely different location in the same store. Pointing directly at
  // the real .pnpm store paths (version-wildcarded, so a future sharp/
  // libvips bump doesn't silently stop matching) sidesteps symlink
  // traversal entirely.
  // Listed relative to both the app directory and the monorepo root
  // (../../) since it's genuinely ambiguous which one Next.js's automatic
  // monorepo trace-root detection resolves these against, and a glob that
  // doesn't match anything real is harmless — cheaper than a fourth failed
  // production round-trip to find out empirically which one is correct.
  outputFileTracingIncludes: {
    '/admin/**': [
      './node_modules/.pnpm/sharp@*/node_modules/sharp/**/*',
      './node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**/*',
      './node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**/*',
      '../../node_modules/.pnpm/sharp@*/node_modules/sharp/**/*',
      '../../node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**/*',
      '../../node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**/*',
    ],
    // The photo-token upload route (app/api/portal/uploads/photo-token)
    // also imports sharp directly (re-encodes the raw blob in
    // onUploadCompleted) but sits outside /admin/**, so the glob above
    // never covered it — confirmed live: it 500'd with the exact same
    // "Could not load the sharp module... libvips-cpp.so.8.18.3: cannot
    // open shared object file" error the /admin/** fix above was written
    // for. Every other sharp importer (dominant-color.ts, pipeline.ts,
    // qrcode.ts, smart-crop.ts) is only ever reached from /admin/** server
    // actions, so this route is the one exception needing its own entry.
    '/api/portal/uploads/photo-token': [
      './node_modules/.pnpm/sharp@*/node_modules/sharp/**/*',
      './node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**/*',
      './node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**/*',
      '../../node_modules/.pnpm/sharp@*/node_modules/sharp/**/*',
      '../../node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**/*',
      '../../node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**/*',
    ],
  },
  experimental: {
    // Default is 4 static-generation workers, each opening its own Prisma
    // connection pool (see lib/portal/db.ts's max: 5) against the local
    // `prisma dev` database — with more pages now querying the DB (Office,
    // EmailSettings, BrandKit, etc. on nearly every route), 4 workers'
    // pools together exceeded what the local dev proxy could sustain
    // ("Server has closed the connection" mid-build). Capping workers is a
    // local-build mitigation; a real production Postgres behind a real
    // build environment doesn't need this.
    cpus: 2,
    // Next.js's Server Action body limit defaults to 1MB — far below this
    // app's own declared image/document caps (lib/portal/media/validate.ts's
    // MAX_BYTES: 25MB for IMAGE and DOCUMENT), so every real photo upload
    // was rejected by the framework before validateMediaFile ever got a
    // chance to apply the app's actual limit. Matches that 25MB ceiling
    // exactly rather than picking an arbitrary larger number — the app's
    // own validator remains the real authority on what's actually allowed.
    serverActions: { bodySizeLimit: '25mb' },
  },
  images: {
    // Allow quality=100 for high-fidelity project photography.
    //
    // DELIBERATELY NOT CHANGED YET — this is the largest remaining saving and
    // it is being held until the next Image Optimization billing period.
    // Three quality values are live at once: quality={100} (11 call sites,
    // incl. all of projects/[slug]), quality={90} (Hero, Lightbox) and the
    // implicit default 75 (~20 files). Vercel's cache key is (url, w, q), so
    // the same photo rendered at two qualities is two transformations —
    // unifying on 90 would roughly halve project-photography transformations.
    //
    // Why not now: usage is ~4.4K of 5K, leaving ~600. Changing q invalidates
    // nothing but makes every width a brand-new key: /projects alone is ~66
    // images x 8 widths = ~528 new transformations, which would consume the
    // remaining allowance on that page's traffic alone. This is exactly the
    // failure mode of commit 526df22 ("Revert quality=100->90 change: made
    // currently-broken images worse"), where new q=90 keys could not be
    // generated against an exhausted quota and MORE images broke, not fewer.
    // Do this at the START of a fresh period, not near its end.
    qualities: [100, 90, 75],
    // Disable image optimization for local assets served from public/
    unoptimized: false,
    // Next's default deviceSizes jumps 1200 -> 1920 with no step between —
    // any hero/rotator image actually rendered in that very common laptop
    // range (confirmed live via PageSpeed Insights: a 1335px-wide and a
    // 1410px-wide slot both got served the 1920px variant, ~45KB and
    // ~17KB heavier than needed) has no closer-fitting size to pick from.
    // Adding 1366/1536 (real, common laptop viewport widths) closes that
    // gap without touching any component's own sizes/quality props.
    // 3840 and 1366 removed (was [640,750,828,1080,1200,1366,1536,1920,2048,3840]).
    // Measured on production HTML: /projects emits srcset entries for ~66
    // distinct images across 11 widths (~726 possible transformations from
    // that page alone), and w=3840 is the single most-referenced width
    // (114 occurrences on /projects, 38 on the homepage) as well as the most
    // expensive tier to generate and store.
    //   - 3840: only ever chosen by 4K displays. With 2048 as the new ceiling
    //     a 4K viewport at the grid's 33vw slot upscales ~1.25x, which is not
    //     perceptible on architectural photography. Full-bleed heroes were
    //     already compromising at 3840 on a 4K/DPR2 screen (which would want
    //     7680), so nothing that was previously pixel-exact stops being so.
    //   - 1366: redundant — 1200 and 1536 bracket it within 14%, and it was
    //     added speculatively alongside 1536 for "common laptop widths".
    // Removing a breakpoint creates NO new cache keys: it only stops future
    // requests at those widths. Existing cached variants stay valid.
    deviceSizes: [640, 750, 828, 1080, 1200, 1536, 1920, 2048],
    // Next 16 defaults minimumCacheTTL to 14400s (4 hours) — verified unset
    // here, so production was running that default. Every optimized variant
    // therefore expired and was RE-WRITTEN roughly six times a day. That is
    // the direct cause of Image Optimization Cache Writes running at ~189K
    // against a 100K allowance while only ~4.4K transformations exist:
    // 4.4K x ~6/day x ~7 days ~= 185K, which matches the observed figure.
    // Project photography under public/ is immutable (content-hashed
    // filenames, replaced by deploy not in place), so a long TTL is correct
    // and carries no staleness risk. 31 days is Vercel's maximum.
    // This changes no cache KEY, so it generates zero new transformations.
    minimumCacheTTL: 2678400,
    // AVIF first, WebP fallback — Next negotiates via the request's
    // Accept header automatically; this only adds format options; it
    // never lowers the quality values set above.
    formats: ['image/avif', 'image/webp'],
    // Explicit because Next 16 defaults an unset localPatterns to
    // [{ pathname: '**', search: '' }] — any local image is fine, but a
    // query string on one isn't (confirmed live: broke the build the
    // moment public-news.ts started requesting /api/media/[id]?variant=
    // for article covers). First entry keeps every existing no-query
    // local image (public/ assets, etc.) working exactly as before;
    // second explicitly allows /api/media/** with any query string, so
    // adding a new ?variant= value later never needs a config change.
    localPatterns: [
      { pathname: '**', search: '' },
      { pathname: '/api/media/**' },
    ],
    // The public Social feed (lib/portal/social/live-feed.ts) renders
    // images straight from each platform's own CDN response — Facebook/
    // Instagram's Graph API returns highly dynamic scontent-*.fbcdn.net
    // subdomains (a fixed hostname can't be pinned), Google Business
    // Profile media lives on googleusercontent.com.
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.licdn.com' },
      { protocol: 'https', hostname: '**.licdn-ei.com' },
    ],
  },
};

export default nextConfig;
