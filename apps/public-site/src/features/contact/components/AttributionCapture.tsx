'use client';

import { useEffect } from 'react';
import { captureAttributionOnLoad } from '../lib/attribution';

// Renders nothing — mounted once in the root layout (see app/layout.tsx),
// same placement tier as <GoogleAnalytics />. Its only job is the
// mount-time effect below; see attribution.ts for why that's the correct
// "first touch" capture point rather than a per-navigation hook.
export function AttributionCapture() {
  useEffect(() => {
    captureAttributionOnLoad();
  }, []);
  return null;
}
