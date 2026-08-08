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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://embed.tawk.to",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://*.tawk.to wss://*.tawk.to",
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
    // AVIF first, WebP fallback — Next negotiates via the request's
    // Accept header automatically; this only adds format options; it
    // never lowers the quality values set above.
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
