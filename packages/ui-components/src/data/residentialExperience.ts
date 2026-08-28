// Verified, client-provided historical/professional residential
// experience — distinct from the case-study-backed Projects dataset
// (see projects.ts). None of these entries correspond to a delivered,
// documented AHW project case study; every wording below uses the
// client's own characterization ("professional experience" /
// "professional involvement"), never upgraded to "AHW project" or
// "delivered by AHW" language. Do not add an entry here without an
// explicit, client-confirmed input — see the go-live audit's repeated
// "do not invent experience" instruction.
export interface ResidentialExperienceEntry {
  id: string;
  name: string;
  region: 'New Cairo' | 'North Coast' | 'West Cairo / 6th of October';
  projectType?: string;
  /** The community's own developer — shown only where independently
   *  confirmed (client-supplied against the developer's own published
   *  project information, e.g. Badya). Never implies a partnership,
   *  endorsement, or appointment between AHW and the developer; it is
   *  objective context about the community itself. Omitted (not a
   *  placeholder string) for every entry where this hasn't been
   *  confirmed — see the other nine entries below. */
  developer?: string;
  /** The exact, pre-approved public-facing wording for this entry —
   *  never regenerated or paraphrased at render time. */
  publicWording: string;
}

export const residentialExperience: ResidentialExperienceEntry[] = [
  { id: 'lake-view', name: 'Lake View', region: 'New Cairo', publicWording: 'Professional experience' },
  { id: 'katameya-heights', name: 'Katameya Heights', region: 'New Cairo', publicWording: 'Professional experience' },
  { id: 'katameya-dunes', name: 'Katameya Dunes', region: 'New Cairo', publicWording: 'Professional involvement' },
  { id: 'hyde-park', name: 'Hyde Park', region: 'New Cairo', publicWording: 'Professional experience' },
  // Client-corrected: Badya is a West Cairo / 6th of October development
  // (Palm Hills Developments), not New Cairo — verified against Palm
  // Hills' own published project information. "Badya" is the primary
  // name used publicly; "Badiya" is not repeated elsewhere to avoid
  // keyword duplication.
  { id: 'badya', name: 'Badya', region: 'West Cairo / 6th of October', developer: 'Palm Hills Developments', publicWording: 'Professional experience' },
  { id: 'mountain-view', name: 'Mountain View', region: 'New Cairo', publicWording: 'Professional experience' },
  { id: 'dyar-park', name: 'Dyar Park', region: 'New Cairo', publicWording: 'Professional experience' },
  { id: 'down-east', name: 'Down East', region: 'New Cairo', publicWording: 'Professional involvement, including client support and supervision' },
  { id: 'b-bay', name: 'B-Bay', region: 'North Coast', projectType: 'Chalet', publicWording: 'Professional experience — chalet' },
  { id: 'al-montazah-village', name: 'Al Montazah Village', region: 'North Coast', publicWording: 'Professional experience' },
];
