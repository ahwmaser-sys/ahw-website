export interface IconProps {
  className?: string;
}

export function MessageSquareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 3.5c-4.9 0-8.9 4-8.9 8.9 0 1.57.41 3.1 1.19 4.44L3.5 20.5l3.75-.98a8.87 8.87 0 0 0 4.79 1.4h0c4.9 0 8.9-4 8.9-8.9a8.86 8.86 0 0 0-2.34-6.32zm-5.55 13.7h0a7.39 7.39 0 0 1-3.76-1.03l-.27-.16-2.79.73.75-2.73-.18-.28a7.38 7.38 0 0 1-1.13-3.95c0-4.08 3.32-7.4 7.4-7.4a7.36 7.36 0 0 1 5.23 2.17 7.36 7.36 0 0 1 2.17 5.24c0 4.08-3.32 7.41-7.42 7.41z" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

/**
 * Maps a ContactHubAction.id (from getContactHubActions) to its icon.
 * Purely presentational — kept separate from the adapter so that non-React
 * consumers of getContactHubActions (JSON-LD, API responses, etc.) never
 * pull in icon/JSX concerns.
 */
export const CONTACT_HUB_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  'start-your-project': CalendarIcon,
  whatsapp: WhatsAppIcon,
  'call-us': PhoneIcon,
  'live-chat': MessageSquareIcon,
};

/** WhatsApp's brand green is a fixed third-party mark, not a themeable
 *  surface color — same reasoning as WhatsAppFloatingButton's own icon.
 *  Everything without an entry here uses the neutral glass surface. */
export const CONTACT_HUB_ACCENT_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
};
