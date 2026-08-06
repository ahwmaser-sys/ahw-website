'use client';

import React, { useEffect, useRef, useState } from 'react';

export type MotionBehavior = 'wipe' | 'aperture' | 'drift' | 'draw' | 'register' | 'fade';

interface NativeRevealProps {
  children?: React.ReactNode;
  behavior?: MotionBehavior;
  delay?: number; // In seconds
  className?: string | undefined;
  as?: React.ElementType;
}

export function NativeReveal({
  children,
  behavior = 'fade',
  delay = 0,
  className = '',
  as: Component = 'div',
}: NativeRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Only run once
        }
      },
      { rootMargin: '0px 0px -100px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const behaviorClass = `motion-${behavior}`;
  const stateClass = isInView ? 'is-revealed' : '';
  const style = delay > 0 ? { animationDelay: `${delay}s`, transitionDelay: `${delay}s` } : undefined;

  return (
    <Component
      ref={ref}
      className={`${behaviorClass} ${stateClass} ${className}`.trim()}
      style={style}
    >
      {children}
    </Component>
  );
}
