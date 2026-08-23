'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  width?: 'fit-content' | '100%';
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  className?: string | undefined;
}

// Horizontal directions ('left'/'right') translate the element by ±40px
// before its reveal settles. That's fine on desktop, where every caller
// of this component places it inside a multi-column grid with room to
// spare — but several callers (DisciplinePage's feature split, About →
// Why AHW, About → Careers) stack to a single, near-full-viewport-width
// column below the site's existing 768px breakpoint, and that same
// ±40px pushes the element's edge past the viewport while it's still in
// its pre-reveal "hidden" state: a real, DOM-measurable horizontal
// overflow (confirmed exactly 16px on a 390px viewport, pixel-matching
// this transform). Reducing the offset only below 768px — the one
// breakpoint value already used everywhere else in this codebase — keeps
// every desktop reveal pixel-identical while removing the mobile
// overflow at its actual source (the transform amplitude), rather than
// clipping/hiding a symptom with overflow-x elsewhere. 16px (--space-4)
// is a real design-token value, not a magic number, and stays safely
// under the 24px of mobile grid padding every affected layout has to
// spare (verified against DisciplinePage.module.css, why-ahw and
// careers' own .introGrid padding) at 390px, 375px, and 360px alike —
// the padding math is viewport-width-independent, not just tuned for
// one screen size. The slide-in effect itself is preserved, just
// shorter, on mobile only.
const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';
const DESKTOP_HORIZONTAL_OFFSET = 40;
const MOBILE_HORIZONTAL_OFFSET = 16;

export function ScrollReveal({
  children,
  width = '100%',
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = ''
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

  // Lazy initializer reads matchMedia synchronously on the first client
  // render, not inside an effect — an effect-based check still leaves a
  // brief window, between mount and the effect running, where Framer
  // Motion's "hidden" variant is computed with the desktop offset, which
  // showed up as measurable (though reduced) overflow during testing.
  // Reading it here removes that window; SSR still has no `window`, so
  // this only ever runs client-side, matching every other client-only
  // check in this codebase.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches : false
  );
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const horizontalOffset = isMobile ? MOBILE_HORIZONTAL_OFFSET : DESKTOP_HORIZONTAL_OFFSET;

  const getVariants = () => {
    switch (direction) {
      case 'up': return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
      case 'down': return { hidden: { opacity: 0, y: -40 }, visible: { opacity: 1, y: 0 } };
      case 'left': return { hidden: { opacity: 0, x: horizontalOffset }, visible: { opacity: 1, x: 0 } };
      case 'right': return { hidden: { opacity: 0, x: -horizontalOffset }, visible: { opacity: 1, x: 0 } };
      case 'none': return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
      default: return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
    }
  };

  return (
    <div ref={ref} style={{ width, position: 'relative' }} className={className}>
      <motion.div
        style={{ width: '100%', height: '100%', position: 'relative' }}
        variants={getVariants()}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration, delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
