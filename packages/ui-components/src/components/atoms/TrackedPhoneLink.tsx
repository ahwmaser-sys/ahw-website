'use client';

import { buildTelLink, handlePhoneLinkClick } from '../../lib/tel';

interface TrackedPhoneLinkProps {
  phone: string;
  className?: string | undefined;
  // Optional, e.g. "AHW Architects Masr (Cairo, Egypt) phone" — names
  // which office/entity this specific number belongs to for screen
  // readers and any tool reading the accessibility tree, so multiple
  // numbers rendered near each other (different offices, or several
  // numbers for one office) stay unambiguous even if visual spacing
  // alone doesn't make that clear. Falls back to the bare number when
  // omitted — every existing call site keeps its exact prior behavior.
  ariaLabel?: string | undefined;
}

// Drop-in replacement for a plain `<a href={buildTelLink(phone)}>` that
// also reports the Google Ads phone-click conversion — same markup/text,
// just with the click handler attached. A small Client Component so it
// can be rendered from Server Components (Footer, the capability
// statement print page) without converting them to client components
// just for this.
export function TrackedPhoneLink({ phone, className, ariaLabel }: TrackedPhoneLinkProps) {
  const href = buildTelLink(phone);
  return (
    <a href={href} className={className} aria-label={ariaLabel} onClick={(e) => handlePhoneLinkClick(e, href)}>
      {phone}
    </a>
  );
}
