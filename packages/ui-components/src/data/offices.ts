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
  /**
   * The same hours in schema.org's syntax, e.g. ["Su-Th 09:00-17:00"].
   * `workingHours` above is prose for a visitor and Google cannot parse it,
   * so the machine-readable form is carried separately rather than derived
   * from that sentence. Empty when an office has not had hours recorded.
   */
  openingHoursSchema?: string[];
  /** Google Maps pin for the office, used for LocalBusiness.geo. */
  geo?: { latitude: number; longitude: number };
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
