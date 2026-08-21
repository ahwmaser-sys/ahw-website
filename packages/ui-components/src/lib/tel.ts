export function buildTelLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

// Google Ads phone-click conversion (AW-18370654415/NlhrCP6-neUcEM_h57dE).
// Mirrors Google's own documented gtag_report_conversion pattern exactly:
// fire the conversion event, then navigate from gtag's own event_callback
// so the beacon has a chance to send before the browser hands off to the
// tel: protocol. The extra setTimeout is a safety net beyond Google's
// snippet — if gtag.js itself never loads (network failure, ad blocker),
// nothing would ever invoke event_callback, and the call must still go
// through regardless. `navigated` guards both paths so navigation (and
// the one conversion event already sent by the single gtag() call below)
// only ever happens once per click.
export function reportPhoneClickConversion(url: string): void {
  const w = window as typeof window & { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== 'function') {
    window.location.href = url;
    return;
  }

  let navigated = false;
  const navigate = () => {
    if (navigated) return;
    navigated = true;
    window.location.href = url;
  };

  window.setTimeout(navigate, 1000);

  w.gtag('event', 'conversion', {
    send_to: 'AW-18370654415/NlhrCP6-neUcEM_h57dE',
    event_callback: navigate,
  });
}

// Shared onClick for any <a href="tel:..."> that should report the phone
// conversion above. No-ops (and lets the browser's normal navigation
// proceed) for any non-tel href passed through the same handler — used
// where a single click handler already exists for multiple link types
// (see ContactHubMenu.tsx) and only the tel: case needs tracking.
export function handlePhoneLinkClick(e: { preventDefault: () => void }, href: string): void {
  if (!href.startsWith('tel:')) return;
  e.preventDefault();
  reportPhoneClickConversion(href);
}
