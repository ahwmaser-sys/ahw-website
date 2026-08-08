'use client';

// Thin wrapper around the gtag() global GoogleAnalytics.tsx installs —
// GA4's own documented recommended-event names only (never invented
// ones), and never a payload containing PII (name/email/phone/message).
// No-ops safely if GA hasn't loaded (measurement ID unset, ad blocker,
// or the event fires before the async script finishes).
type GtagFn = (...args: unknown[]) => void;

export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', name, params);
}
