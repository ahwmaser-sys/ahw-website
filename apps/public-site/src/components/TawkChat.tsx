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
 * `crossorigin="*"` on the injected <script> matches Tawk's own current
 * official embed snippet exactly (pulled directly from the account's Tawk
 * dashboard — Administration → Chat Widget → Widget Code, 2026-08-27). A
 * prior fix in this codebase removed this attribute based on an observed
 * ERR_FAILED — that observation predates Tawk's CDN sending
 * `Access-Control-Allow-Origin: *` (confirmed live via curl against
 * embed.tawk.to today) and was itself the cause of a real regression:
 * without `crossorigin`, Chrome's Opaque Response Blocking rejects the
 * script outright (net::ERR_BLOCKED_BY_ORB, confirmed live on production)
 * because Tawk's CDN serves it with the legacy `application/x-javascript`
 * Content-Type. Restoring the official attribute is the fix.
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
          s1.src = 'https://embed.tawk.to/6a6f0595055f021d4ace1bdb/1jv0qrk1v';
          s1.charset = 'UTF-8';
          s1.setAttribute('crossorigin', '*');
          s0.parentNode.insertBefore(s1, s0);
        })();
      `}
    </Script>
  );
}
