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
  },
  images: {
    // Allow quality=100 for high-fidelity project photography
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1366, 1536, 1920, 2048, 3840],
    // AVIF first, WebP fallback — Next negotiates via the request's
    // Accept header automatically; this only adds format options; it
    // never lowers the quality values set above.
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
