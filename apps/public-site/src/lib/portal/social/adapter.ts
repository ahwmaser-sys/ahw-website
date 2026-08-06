import type { SocialAdapter } from './types';
import { instagramAdapter } from './instagram';
import { facebookAdapter } from './facebook';
import { linkedinAdapter } from './linkedin';
import { googleBusinessAdapter } from './google-business';

// The one place a new platform gets registered as *code* — everything
// else in dispatch.ts iterates this list generically. Whether a
// registered platform actually participates in dispatch (separate from
// whether it's *implemented*) is a database row
// (PublishingDestination.isEnabled), not this array — see dispatch.ts.
export const socialAdapters: readonly SocialAdapter[] = [instagramAdapter, facebookAdapter, linkedinAdapter, googleBusinessAdapter];
