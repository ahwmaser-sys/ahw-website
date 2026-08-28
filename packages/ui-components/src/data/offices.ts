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

  // Optional legal/registration identity — present only when an admin has
  // entered a value AND enabled display for it (see toLegacyOfficeShape in
  // apps/public-site/src/lib/portal/offices.ts, the only place that builds
  // this object). Absent (not merely empty-string) is the "don't render
  // this row" signal Footer relies on — never render a label for a field
  // that wasn't supplied.
  legal?: {
    legalEntityName?: string;
    commercialRegistrationNumber?: string;
    taxRegistrationNumber?: string;
    vatRegistrationNumber?: string;
    licenseNumber?: string;
    otherRegistrationIdentifier?: string;
  };
}
