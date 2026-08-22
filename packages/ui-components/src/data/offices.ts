// The shared shape every office-aware component in this package expects
// — Footer, FooterSocialLinks, FloatingContactHub, getContactHubActions.
// The data itself no longer lives here: this
// package stays a pure, storage-agnostic UI library, so real offices are
// fetched from the database by apps/public-site (see
// apps/public-site/src/lib/portal/offices.ts) and passed down as props.
// Unlimited offices, never an assumption of exactly Egypt + Kuwait —
// every consumer below already iterates whatever array it's given.
export interface Office {
  id: string;
  name: string;
  displayName: string;
  country: string;
  isHeadquarters?: boolean;

  address: {
    full: string;
    street: string;
    building: string;
    city: string;
    // Optional — only populated where verified against the office's real
    // Google Business Profile listing, not every office has one on file.
    postalCode?: string;
    mapLink: string;
    embedUrl: string;
  };

  contact: {
    primaryEmail: string;
    generalEmail: string;

    phones: string[];

    whatsapp?: string;

    bookingUrl?: string;

    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };

  workingHours: string;
  timezone: string;
}
