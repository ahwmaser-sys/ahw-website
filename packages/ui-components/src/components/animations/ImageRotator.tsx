'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './ImageRotator.module.css';

export interface ImageRotatorProps {
  /** Curated image list — the rotation shows exactly these, in this order. */
  images: string[];
  alt?: string;
  /** Milliseconds between crossfades. Kept slow and deliberate by default. */
  intervalMs?: number;
  /** Opacity of the visible slide. Hero uses ~0.7 so scrims can darken it for
   *  text contrast; a standalone showcase (no overlaid text) should use 1. */
  activeOpacity?: number;
  sizes?: string;
  quality?: number;
  className?: string;
}

/**
 * Rotates through a small, curated set of images with a slow crossfade.
 * Only the first image carries LCP priority. Used by Hero's background and
 * any other homepage section that shows a curated rotation behind fixed text.
 */
export function ImageRotator({
  images,
  alt = '',
  intervalMs = 6500,
  activeOpacity = 1,
  sizes = '100vw',
  quality = 90,
  className = '',
}: ImageRotatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div className={`${styles.rotator} ${className}`}>
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          priority={index === 0}
          fetchPriority={index === 0 ? 'high' : undefined}
          className={styles.rotatorImage}
          style={{ opacity: index === activeIndex ? activeOpacity : 0 }}
        />
      ))}
    </div>
  );
}
