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
}

export function HeroSlider({ images, alt, interval = 5000, lightbox = false, sizes = '100vw', orientation = 'landscape' }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Only the slides a viewer has actually reached get an <Image> mounted.
  // HeroSlider previously rendered every image in `images` up front (just
  // opacity-hidden for inactive slides), so a project with a 10-image
  // gallery shipped all 10 immediately regardless of whether anyone ever
  // scrolled to it — confirmed via a real page-weight measurement (the
  // Projects index, with 20 of these sliders, was loading ~11.8MB on a
  // single page load). Slide 1 is preloaded alongside slide 0 so the
  // first autoplay transition still crossfades instead of popping in.
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(
    () => new Set(images.length > 1 ? [0, 1] : [0])
  );

  useEffect(() => {
    setVisitedIndices((prev) => (prev.has(currentIndex) ? prev : new Set(prev).add(currentIndex)));
  }, [currentIndex]);

  useEffect(() => {
    if (images.length <= 1 || lightboxOpen) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval, lightboxOpen]);

  if (!images || images.length === 0) return null;

  return (
    <div className={`${styles.container} ${orientation === 'portrait' ? styles.containerPortrait : ''}`}>
      {images.map((img, index) => {
        const isActive = index === currentIndex;
        const isVisited = visitedIndices.has(index);
        const slideImage = isVisited ? (
          <Image
            src={img}
            alt={`${alt} - ${index + 1}`}
            fill
            sizes={sizes}
            quality={90}
            className={`${styles.image} ${orientation === 'portrait' ? styles.imagePortrait : ''}`}
            priority={index === 0}
            fetchPriority={index === 0 ? 'high' : undefined}
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
