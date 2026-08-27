import Script from 'next/script';

/**
 * Both Tawk_API assignments below are Tawk's own documented pre-init config
 * (set before the embed script runs) — not CSS/DOM overrides, and not
 * changes to the embed URL or init logic itself:
 *
 * - `visibility` positions Tawk's own UI anchor (kept from an earlier fix;
 *   left as-is since it may still affect where the maximized chat panel
 *   anchors, even though the launcher itself is now hidden below).
 * - `onLoad` calls the official `hideWidget()` API to hide only the default
 *   launcher bubble. The widget itself keeps running — ChatFloatingButton
 *   (packages/ui-components) opens it via the equally-official
 *   `Tawk_API.maximize()`, so chat still works exactly as before.
 * - `onChatEnded` calls the official `minimize()` API when Tawk's own chat
 *   lifecycle reports the session has terminated (documented at
 *   developer.tawk.to/jsapi/ — the only event named for chat-ended,
 *   fired regardless of whether a human agent, Apollo AI Assist, or an
 *   inactivity timeout closed it). Only ever minimizes — never hides,
 *   disables, or blocks starting a new chat — so the widget stays exactly
 *   as available as before, just not left maximized after a finished
 *   conversation. Deliberately NOT based on scanning message text for
 *   "goodbye" or any other brittle heuristic.
 *
 * No `crossorigin` attribute on the injected <script> — setting one (this
 * file previously set `crossorigin="*"`) forces the browser to fetch the
 * script in CORS mode, which embed.tawk.to's CDN doesn't answer with an
 * Access-Control-Allow-Origin header. Confirmed live via PageSpeed
 * Insights: the request failed outright (net::ERR_FAILED), meaning the
 * whole chat widget silently never loaded. A plain cross-origin <script
 * src> load doesn't need CORS at all — Tawk's own embed snippet never
 * sets this attribute either.
 *
 * The script loads from /api/tawk-widget (this app's own route, which
 * fetches and re-serves Tawk's script) rather than embed.tawk.to
 * directly — Tawk's CDN serves the script with the legacy
 * `application/x-javascript` Content-Type, which Chrome's Opaque
 * Response Blocking rejects for this exact no-crossorigin cross-origin
 * load (confirmed live: net::ERR_BLOCKED_BY_ORB on every real-Chrome
 * navigation, meaning the widget never actually loaded). Same-origin
 * sidesteps ORB entirely; see api/tawk-widget/route.ts.
 */
export function TawkChat() {
  return (
    <Script id="tawk-to-widget" strategy="afterInteractive">
      {`
        var Tawk_API = Tawk_API || {};
        var Tawk_LoadStart = new Date();
        Tawk_API.visibility = {
          desktop: { position: 'br', xOffset: 24, yOffset: 96 },
          tablet: { position: 'br', xOffset: 24, yOffset: 96 },
          mobile: { position: 'br', xOffset: 16, yOffset: 84 }
        };
        Tawk_API.onLoad = function(){
          Tawk_API.hideWidget();
        };
        Tawk_API.onChatEnded = function(){
          Tawk_API.minimize();
        };
        (function(){
          var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
          s1.async = true;
          s1.src = '/api/tawk-widget';
          s1.charset = 'UTF-8';
          s0.parentNode.insertBefore(s1, s0);
        })();
      `}
    </Script>
  );
}
