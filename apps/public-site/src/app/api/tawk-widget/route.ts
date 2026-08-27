import { NextResponse } from 'next/server';

const TAWK_SCRIPT_URL = 'https://embed.tawk.to/6a6f0595055f021d4ace1bdb/1jv0qrk1v';

// Proxies Tawk's embed script same-origin. Tawk's CDN serves it with the
// legacy `application/x-javascript` Content-Type, which Chrome's Opaque
// Response Blocking rejects for a cross-origin <script src> load with no
// `crossorigin` attribute (the setup TawkChat.tsx intentionally uses) —
// confirmed live: net::ERR_BLOCKED_BY_ORB on every real-Chrome navigation,
// meaning the chat widget's entry script never executed for visitors.
// Re-serving the same script same-origin with a standard
// `application/javascript` Content-Type sidesteps ORB entirely; nothing
// about the widget's own behavior (visibility, hideWidget/maximize) changes
// since this only changes where the browser fetches the entry script from.
export async function GET() {
  const response = await fetch(TAWK_SCRIPT_URL, { next: { revalidate: 3600 } });

  if (!response.ok) {
    const snippet = (await response.text()).slice(0, 300);
    console.error(`[tawk-widget] upstream ${response.status} ${response.statusText}: ${snippet}`);
    return new NextResponse('', { status: 502 });
  }

  const body = await response.text();
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
