'use client';

import { useEffect, useRef, useState } from 'react';
import type { Office } from '../../data/offices';
import { buildWhatsAppLink } from '../../lib/whatsapp';
import styles from './FooterSocialLinks.module.css';

// WhatsApp/Instagram/Facebook/LinkedIn are per-office (each office has its
// own account), so each opens a small popover of offices rather than
// linking straight out — the platform button itself carries no single
// office's link. `offices` comes from the real database (see
// apps/public-site/src/lib/portal/offices.ts), so this scales to
// however many offices exist, not a fixed two.
export function FooterSocialLinks({ offices, linkClassName }: { offices: readonly Office[]; linkClassName?: string | undefined }) {
  const [instagramOpen, setInstagramOpen] = useState(false);
  const instagramRef = useRef<HTMLDivElement>(null);
  const instagramButtonRef = useRef<HTMLButtonElement>(null);
  const instagramOffices = offices.filter((office) => office.contact.instagram);

  const [facebookOpen, setFacebookOpen] = useState(false);
  const facebookRef = useRef<HTMLDivElement>(null);
  const facebookButtonRef = useRef<HTMLButtonElement>(null);
  const facebookOffices = offices.filter((office) => office.contact.facebook);

  const [linkedinOpen, setLinkedinOpen] = useState(false);
  const linkedinRef = useRef<HTMLDivElement>(null);
  const linkedinButtonRef = useRef<HTMLButtonElement>(null);
  const linkedinOffices = offices.filter((office) => office.contact.linkedin);

  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const whatsappRef = useRef<HTMLDivElement>(null);
  const whatsappButtonRef = useRef<HTMLButtonElement>(null);
  const whatsappOffices = offices.filter((office) => office.contact.whatsapp);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (instagramOpen && instagramRef.current && !instagramRef.current.contains(event.target as Node)) {
        setInstagramOpen(false);
      }
      if (facebookOpen && facebookRef.current && !facebookRef.current.contains(event.target as Node)) {
        setFacebookOpen(false);
      }
      if (linkedinOpen && linkedinRef.current && !linkedinRef.current.contains(event.target as Node)) {
        setLinkedinOpen(false);
      }
      if (whatsappOpen && whatsappRef.current && !whatsappRef.current.contains(event.target as Node)) {
        setWhatsappOpen(false);
      }
    };
    // Escape closes whichever popover is open and returns focus to its own
    // trigger button, matching the same pattern used by the Lightbox and
    // the mobile nav panel elsewhere in this codebase.
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (whatsappOpen) { setWhatsappOpen(false); whatsappButtonRef.current?.focus(); }
      if (instagramOpen) { setInstagramOpen(false); instagramButtonRef.current?.focus(); }
      if (facebookOpen) { setFacebookOpen(false); facebookButtonRef.current?.focus(); }
      if (linkedinOpen) { setLinkedinOpen(false); linkedinButtonRef.current?.focus(); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [instagramOpen, facebookOpen, linkedinOpen, whatsappOpen]);

  const linkClass = linkClassName ? `${styles.link} ${linkClassName}` : styles.link;

  return (
    <>
      {whatsappOffices.length === 1 ? (
        <a
          href={buildWhatsAppLink(whatsappOffices[0]!.contact.whatsapp!, "Hi AHW Architects, I'd like to enquire about a project.")}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          WhatsApp
        </a>
      ) : whatsappOffices.length > 1 && (
        <div className={styles.socialWrapper} ref={whatsappRef}>
          <button
            ref={whatsappButtonRef}
            type="button"
            className={linkClass}
            onClick={() => {
              setWhatsappOpen((open) => !open);
              setInstagramOpen(false);
              setFacebookOpen(false);
              setLinkedinOpen(false);
            }}
            aria-expanded={whatsappOpen}
          >
            WhatsApp
          </button>
          {whatsappOpen && (
            <div className={styles.socialPopover}>
              {whatsappOffices.map((office) => (
                <a
                  key={office.id}
                  href={buildWhatsAppLink(office.contact.whatsapp!, "Hi AHW Architects, I'd like to enquire about a project.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialOption}
                >
                  {office.country}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* A single office is the common case (one Instagram/Facebook/
          LinkedIn per office) — linking straight out avoids a button that
          visibly does nothing on first click. The dropdown only earns its
          keep once 2+ offices actually have this platform set. */}
      {instagramOffices.length === 1 ? (
        <a href={normalizeExternalUrl(instagramOffices[0]!.contact.instagram!)} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Instagram
        </a>
      ) : instagramOffices.length > 1 && (
        <div className={styles.socialWrapper} ref={instagramRef}>
          <button
            ref={instagramButtonRef}
            type="button"
            className={linkClass}
            onClick={() => {
              setInstagramOpen((open) => !open);
              setFacebookOpen(false);
              setLinkedinOpen(false);
            }}
            aria-expanded={instagramOpen}
          >
            Instagram
          </button>
          {instagramOpen && (
            <div className={styles.socialPopover}>
              {instagramOffices.map((office) => (
                <a
                  key={office.id}
                  href={normalizeExternalUrl(office.contact.instagram!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialOption}
                >
                  {office.country}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {facebookOffices.length === 1 ? (
        <a href={normalizeExternalUrl(facebookOffices[0]!.contact.facebook!)} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Facebook
        </a>
      ) : facebookOffices.length > 1 && (
        <div className={styles.socialWrapper} ref={facebookRef}>
          <button
            ref={facebookButtonRef}
            type="button"
            className={linkClass}
            onClick={() => {
              setFacebookOpen((open) => !open);
              setInstagramOpen(false);
              setLinkedinOpen(false);
            }}
            aria-expanded={facebookOpen}
          >
            Facebook
          </button>
          {facebookOpen && (
            <div className={styles.socialPopover}>
              {facebookOffices.map((office) => (
                <a
                  key={office.id}
                  href={normalizeExternalUrl(office.contact.facebook!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialOption}
                >
                  {office.country}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {linkedinOffices.length === 1 ? (
        <a href={normalizeExternalUrl(linkedinOffices[0]!.contact.linkedin!)} target="_blank" rel="noopener noreferrer" className={linkClass}>
          LinkedIn
        </a>
      ) : linkedinOffices.length > 1 && (
        <div className={styles.socialWrapper} ref={linkedinRef}>
          <button
            ref={linkedinButtonRef}
            type="button"
            className={linkClass}
            onClick={() => {
              setLinkedinOpen((open) => !open);
              setInstagramOpen(false);
              setFacebookOpen(false);
            }}
            aria-expanded={linkedinOpen}
          >
            LinkedIn
          </button>
          {linkedinOpen && (
            <div className={styles.socialPopover}>
              {linkedinOffices.map((office) => (
                <a
                  key={office.id}
                  href={normalizeExternalUrl(office.contact.linkedin!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialOption}
                >
                  {office.country}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Admin-entered social URLs are plain text inputs (Settings → Offices) —
// an admin can save "instagram.com/ahw" without a protocol, which browsers
// resolve as a broken relative link instead of navigating out. Treat a
// missing protocol as the one thing worth defending against here.
function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
