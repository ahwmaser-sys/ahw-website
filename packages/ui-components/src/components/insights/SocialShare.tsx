'use client';

import { WhatsAppIcon } from '../navigation/contactHubIcons';
import styles from './SocialShare.module.css';

export interface SocialShareProps {
  url: string;
  title: string;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.9 2.25h3.68l-8.04 9.19L24 21.75h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 2.25h7.59l5.24 6.93zm-1.29 17.52h2.04L6.5 4.12H4.3z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

export function SocialShare({ url, title }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, Icon: XIcon },
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, Icon: WhatsAppIcon },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, Icon: LinkedInIcon },
    { label: 'Email', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, Icon: MailIcon },
  ];

  return (
    <div className={styles.share}>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target={label === 'Email' ? undefined : '_blank'}
          rel={label === 'Email' ? undefined : 'noopener noreferrer'}
          className={styles.iconLink}
          aria-label={`Share on ${label}`}
        >
          <Icon className={styles.icon} />
        </a>
      ))}
    </div>
  );
}
