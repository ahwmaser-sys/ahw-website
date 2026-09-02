// Canonical list of required social/web output sizes. Adding a 9th
// platform size is editing this array — never touches the pipeline, the
// template engine, or the database schema (GeneratedGraphicOutput.purpose
// and MediaAssetVariant.purpose are both free strings for exactly this
// reason). Real, current platform-recommended dimensions as of this
// writing; Facebook/LinkedIn/OG intentionally share one render since
// they're within a few px of each other.
export interface OutputTarget {
  key: string;
  label: string;
  width: number;
  height: number;
}

export const OUTPUT_TARGETS: readonly OutputTarget[] = [
  { key: 'instagram-portrait', label: 'Instagram Portrait', width: 1080, height: 1350 },
  { key: 'instagram-square', label: 'Instagram Square', width: 1080, height: 1080 },
  { key: 'facebook', label: 'Facebook', width: 1200, height: 630 },
  { key: 'linkedin', label: 'LinkedIn', width: 1200, height: 627 },
  { key: 'google-business', label: 'Google Business Profile', width: 1200, height: 900 },
  { key: 'website-hero', label: 'Website Hero', width: 1920, height: 1080 },
  { key: 'website-thumbnail', label: 'Website Thumbnail', width: 800, height: 600 },
  { key: 'open-graph', label: 'Open Graph', width: 1200, height: 630 },
  { key: 'avatar-square', label: 'Avatar', width: 400, height: 400 },
];

export function getOutputTarget(key: string): OutputTarget | undefined {
  return OUTPUT_TARGETS.find((t) => t.key === key);
}
