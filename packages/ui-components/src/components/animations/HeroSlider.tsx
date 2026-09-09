'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Lightbox } from '../gallery/Lightbox';
import styles from './HeroSlider.module.css';

interface HeroSliderProps {
  images: string[];
  alt: string;
  interval?: number;
  /** Opt-in: clicking a slide opens a full gallery lightbox (keyboard nav,
   * focus trap, swipe). Off by default since most HeroSlider usages are
   * link-wrapped navigational cards, not standalone galleries — only pass
   * true where the slider IS the gallery (e.g. a project detail page). */
  lightbox?: boolean;
  /** How much of the viewport this slider actually renders at — passed
   * straight to next/image's `sizes`. Defaults to full-bleed (100vw);
   * override for anything rendered narrower (e.g. a grid card) so the
   * optimizer doesn't generate a full-viewport-width image for a
   * half-width card. */
  sizes?: string;
  /** Image orientation. Defaults to landscape. */
  orientation?: 'landscape' | 'portrait' | undefined;
  /**
   * Marks this slider's first slide as the page's LCP image: eager, high
   * fetch priority, and preloaded.
   *
   * OFF BY DEFAULT, and that default is load-bearing. Slide 0 used to get
   * `priority` unconditionally, which is right for ONE hero and wrong
   * everywhere else: /projects renders 20 of these sliders, so 20 images
   * were requested eagerly at high priority on first paint, most of them far
   * below the fold. Measured on the live page: 22 eager/high-priority images,
   * 2.8MB of image transfer, LCP 5.3s locally and 48.8s at P75 in Vercel
   * Speed Insights. They were all competing with the one image the visitor
   * could actually see.
   *
   * With this false, next/image lazy-loads the slide, so a below-the-fold
   * slider costs nothing until it is scrolled near. Set it true on exactly
   * one slider per page: the one that is visible first.
   */
  priority?: boolean;
}

export function HeroSlider({ images, alt, interval = 5000, lightbox = false, sizes = '100vw', orientation = 'landscape', priority = false }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Whether this slider is on screen or close to it. `priority` marks the one
  // slider that is visible on arrival, so it starts active with no observer
  // round-trip; every other slider stays dormant until scrolled near.
  //
  // This exists because a dormant slider is not free. `loading="lazy"` does
  // not mean "loads when visible": Chrome widens its lazy-load distance a
  // long way on slow connections, so on the Projects index (20 sliders) the
  // cards at 1000-3700px below the fold had all fetched by the time the page
  // finished loading, two images each. Measured on the live page at 1.6Mbps
  // with 4x CPU throttle: 24 images, 3.4MB, LCP 10.8s.
  const [isNearViewport, setIsNearViewport] = useState(priority);

  // Only the slides a viewer has actually reached get an <Image> mounted.
  // HeroSlider previously rendered every image in `images` up front (just
  // opacity-hidden for inactive slides), so a project with a 10-image
  // gallery shipped all 10 immediately regardless of whether anyone ever
  // scrolled to it — confirmed via a real page-weight measurement (the
  // Projects index, with 20 of these sliders, was loading ~11.8MB on a
  // single page load).
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    if (priority) return; // already active; nothing to observe
    const node = containerRef.current;
    // Without IntersectionObserver, fall back to the old always-on behaviour
    // rather than a slider that never advances.
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        // One-way: once a slider has been reached it stays awake, so
        // scrolling back and forth cannot restart its images.
        setIsNearViewport(true);
        observer.disconnect();
      },
      // Roughly a screen and a half of lead time. Tuned by measurement on
      // the Projects index at 1.6Mbps: at 300px a fast scroll outran the
      // fetches and cards showed briefly empty, while Chrome's own lazy
      // threshold went so far the other way it had every card in flight
      // during load. This is the middle: cards are fetched well before they
      // are reached, and the hero does not compete with twenty of them.
      { rootMargin: '1200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [priority]);

  // Preload the NEXT slide only once this slider is in play, so the first
  // autoplay transition crossfades instead of popping in. Off-screen cards
  // never pay for it: that second image was half the image weight of the
  // Projects index, one per card, for cards most visitors never reach.
  useEffect(() => {
    if (!isNearViewport || images.length <= 1) return;
    setVisitedIndices((prev) => (prev.has(1) ? prev : new Set(prev).add(1)));
  }, [isNearViewport, images.length]);

  useEffect(() => {
    setVisitedIndices((prev) => (prev.has(currentIndex) ? prev : new Set(prev).add(currentIndex)));
  }, [currentIndex]);

  useEffect(() => {
    // An off-screen slider does not advance. Beyond not mounting more images,
    // this stops 20 timers on the Projects index from re-rendering sliders
    // nobody is looking at — real work on a phone.
    if (images.length <= 1 || lightboxOpen || !isNearViewport) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval, lightboxOpen, isNearViewport]);

  if (!images || images.length === 0) return null;

  return (
    <div ref={containerRef} className={`${styles.container} ${orientation === 'portrait' ? styles.containerPortrait : ''}`}>
      {images.map((img, index) => {
        const isActive = index === currentIndex;
        // Nothing is fetched for a slider the viewer has not reached. This is
        // stricter than `loading="lazy"` on purpose: lazy is a hint Chrome
        // widens a long way on slow connections, which is how 19 card images
        // ended up in flight against the hero.
        const isVisited = isNearViewport && visitedIndices.has(index);
        const slideImage = isVisited ? (
          <Image
            src={img}
            alt={`${alt} - ${index + 1}`}
            fill
            sizes={sizes}
            quality={100}
            className={`${styles.image} ${orientation === 'portrait' ? styles.imagePortrait : ''}`}
            priority={priority && index === 0}
            fetchPriority={priority && index === 0 ? 'high' : undefined}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : null;
        return (
          <div
            key={`${img}-${index}`}
            className={`${styles.slide} ${isActive ? styles.active : ''}`}
            aria-hidden={!isActive}
          >
            {lightbox ? (
              <button
                type="button"
                ref={isActive ? triggerRef : undefined}
                className={styles.lightboxTrigger}
                onClick={() => setLightboxOpen(true)}
                aria-label={`Expand image ${index + 1} of ${images.length}`}
                tabIndex={isActive ? 0 : -1}
              >
                {slideImage}
              </button>
            ) : (
              slideImage
            )}
          </div>
        );
      })}

      {images.length > 1 && (
        <div className={styles.indicators}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {lightbox && lightboxOpen && (
        <Lightbox
          images={images}
          alt={alt}
          index={currentIndex}
          onIndexChange={setCurrentIndex}
          onClose={() => setLightboxOpen(false)}
          triggerRef={triggerRef}
        />
      )}
    </div>
  );
}
