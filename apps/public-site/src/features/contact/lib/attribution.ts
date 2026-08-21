// First-touch marketing attribution — captured once per browser session,
// read back by ContactForm at submit time. Deliberately NOT read via
// Next's useSearchParams()/usePathname() (which would require a Suspense
// boundary around the capture point and re-run on every client-side
// navigation): a plain window.location.search read in a mount-only effect
// is both simpler and more correct here — App Router keeps the root
// layout mounted across client-side navigations, so a component placed
// there only re-reads the URL on an actual full navigation (a fresh ad
// click), which is exactly "first touch."
//
// First-touch, not last-touch: once a value is stored for the session it
// is never overwritten, even if the visitor later clicks an internal
// link that happens to carry different params — this only ever captures
// the URL that brought them to the site in the first place.

const STORAGE_KEY = 'ahw_attribution_v1';

export interface AttributionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  referrer?: string;
  landingPath?: string;
}

const QUERY_PARAM_NAMES = {
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  utmCampaign: 'utm_campaign',
  utmContent: 'utm_content',
  utmTerm: 'utm_term',
  gclid: 'gclid',
  fbclid: 'fbclid',
  ttclid: 'ttclid',
} as const satisfies Partial<Record<keyof AttributionData, string>>;
const PARAM_KEYS = Object.keys(QUERY_PARAM_NAMES) as (keyof typeof QUERY_PARAM_NAMES)[];

// Called once on mount from AttributionCapture (root layout). No-ops if
// this session already has attribution stored, or if the current URL
// carries none of the tracked params (an internal/direct visit doesn't
// overwrite an earlier ad click's attribution within the same session).
export function captureAttributionOnLoad(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const data: AttributionData = {};
    for (const key of PARAM_KEYS) {
      const value = params.get(QUERY_PARAM_NAMES[key]);
      if (value) data[key] = value;
    }
    if (Object.keys(data).length === 0) return;

    if (document.referrer) data.referrer = document.referrer;
    data.landingPath = window.location.pathname;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (private browsing, disabled storage) —
    // attribution capture is a nice-to-have, never allowed to break
    // page load or the contact form itself.
  }
}

// Read back at contact-form submit time.
export function getStoredAttribution(): AttributionData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AttributionData) : {};
  } catch {
    return {};
  }
}
