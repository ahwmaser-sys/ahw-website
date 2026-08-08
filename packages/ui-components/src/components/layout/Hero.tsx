'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';
import { Button } from '../atoms/Button';
import { Breadcrumbs, type BreadcrumbItem } from '../navigation/Breadcrumbs';
import { ImageRotator } from '../animations/ImageRotator';

export interface HeroProps {
  title: React.ReactNode;
  supportingHeading?: React.ReactNode;
  subtitle: string;
  videoSrc?: string;
  posterSrc?: string;
  /** Optional: rotate through a small set of images instead of a single static poster.
   *  Falls back to posterSrc when omitted or given a single image — every other page
   *  using Hero is unaffected. */
  posterSrcs?: string[];
  posterAlt?: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  breadcrumbs?: BreadcrumbItem[];
}

export const Hero: React.FC<HeroProps> = ({
  title,
  supportingHeading,
  subtitle,
  videoSrc,
  posterSrc,
  posterSrcs,
  posterAlt = '',
  primaryAction,
  secondaryAction,
  breadcrumbs
}) => {
  const [loaded, setLoaded] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);

  const rotationImages = posterSrcs && posterSrcs.length > 1 ? posterSrcs : null;

  useEffect(() => {
    // A brief tick so the entrance transition still reads as an intentional
    // reveal rather than a hard cut, without gating real content behind a
    // multi-second artificial delay.
    const timer = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Simple parallax on scroll, batched to one update per animation frame
    // instead of a setState on every scroll event.
    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setOffsetY(window.scrollY);
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className={styles.heroContainer}>
      {videoSrc ? (
        <video
          ref={videoRef}
          className={`${styles.videoBackground} ${loaded ? styles.videoLoaded : ''}`}
          style={{ transform: `translateY(${offsetY * 0.3}px) scale(${loaded ? 1 : 1.05})` }}
          autoPlay
          loop
          muted
          playsInline
          poster={posterSrc}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : rotationImages ? (
        <div
          className={`${styles.imageRotation} ${loaded ? styles.videoLoaded : ''}`}
          style={{ transform: `translateY(${offsetY * 0.3}px) scale(${loaded ? 1 : 1.05})` }}
        >
          <ImageRotator images={rotationImages} alt={posterAlt} activeOpacity={0.7} />
        </div>
      ) : posterSrc ? (
        // A single-image hero is very likely the page's LCP element — a
        // CSS background-image on a plain div isn't discovered by the
        // browser's preload scanner until stylesheets are parsed, unlike
        // next/image with priority, which the scanner finds directly in
        // the initial HTML.
        <Image
          src={posterSrc}
          alt={posterAlt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={90}
          className={`${styles.videoBackground} ${loaded ? styles.videoLoaded : ''}`}
          style={{ transform: `translateY(${offsetY * 0.3}px) scale(${loaded ? 1 : 1.05})` }}
        />
      ) : null}

      {/* Scrims for lighting depth */}
      <div className={styles.scrimTop}></div>
      <div className={styles.scrimBottom}></div>

      <div
        className={styles.content}
        style={{ transform: `translateY(${offsetY * -0.1}px)` }}
      >
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} variant="onDark" />}
        <h1 className={styles.title}>{title}</h1>
        {supportingHeading && (
          <h2 className={styles.supportingHeading}>
            {supportingHeading}
          </h2>
        )}
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.actions}>
          {primaryAction && (
            <Button variant="cta" as="a" href={primaryAction.href}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" as="a" href={secondaryAction.href}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};
