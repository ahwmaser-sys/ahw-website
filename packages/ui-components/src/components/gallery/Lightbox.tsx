'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './Lightbox.module.css';

interface LightboxProps {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Focus returns here on close — normally the thumbnail/slide that opened the lightbox. */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function Lightbox({ images, alt, index, onIndexChange, onClose, triggerRef }: LightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => onIndexChange((index - 1 + images.length) % images.length), [index, images.length, onIndexChange]);
  const goNext = useCallback(() => onIndexChange((index + 1) % images.length), [index, images.length, onIndexChange]);

  // Focus the close button on open; restore focus to whatever opened the
  // lightbox on close — same pattern as the header's nav panel.
  useEffect(() => {
    closeButtonRef.current?.focus();
    return () => {
      triggerRef?.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes, ArrowLeft/ArrowRight navigate, Tab is trapped inside
  // the dialog while it's open.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  // Lock body scroll while open. `clip`, not `hidden` — hidden on only one
  // axis forces the other to compute as `auto`, turning body into an
  // unintended scroll container that can hijack position:sticky
  // descendants once the lock lifts (confirmed empirically elsewhere in
  // this codebase's header work).
  useEffect(() => {
    document.body.style.overflow = 'clip';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  const currentImage = images[index];
  if (!currentImage) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      ref={dialogRef}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close gallery"
      >
        &times;
      </button>

      {images.length > 1 && (
        <button
          type="button"
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Previous image"
        >
          &larr;
        </button>
      )}

      <div className={styles.imageWrapper} onClick={(e) => e.stopPropagation()}>
        <Image
          src={currentImage}
          alt={`${alt} — image ${index + 1} of ${images.length}`}
          fill
          sizes="100vw"
          quality={90}
          className={styles.image}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {images.length > 1 && (
        <button
          type="button"
          className={`${styles.navButton} ${styles.nextButton}`}
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Next image"
        >
          &rarr;
        </button>
      )}

      {images.length > 1 && (
        <div className={styles.counter} aria-live="polite">{index + 1} / {images.length}</div>
      )}
    </div>
  );
}
