'use client';

import { buildTelLink, handlePhoneLinkClick } from '../../lib/tel';

interface TrackedPhoneLinkProps {
  phone: string;
  className?: string | undefined;
}

// Drop-in replacement for a plain `<a href={buildTelLink(phone)}>` that
// also reports the Google Ads phone-click conversion — same markup/text,
// just with the click handler attached. A small Client Component so it
// can be rendered from Server Components (Footer, the capability
// statement print page) without converting them to client components
// just for this.
export function TrackedPhoneLink({ phone, className }: TrackedPhoneLinkProps) {
  const href = buildTelLink(phone);
  return (
    <a href={href} className={className} onClick={(e) => handlePhoneLinkClick(e, href)}>
      {phone}
    </a>
  );
}
