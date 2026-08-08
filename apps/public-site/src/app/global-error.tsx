'use client';

import { useEffect } from 'react';

// error.tsx only catches errors thrown by page/layout content nested
// inside the root layout — a failure in the root layout itself (e.g.
// getActiveBrandKit()/getActiveOffices() throwing) has no layout left to
// render into, so Next.js falls back to its own unstyled default unless
// this file exists. Deliberately self-contained (inline styles, no
// dependency on globals.css tokens or next/font) since this is the one
// page that must render even if something upstream of normal styling
// failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          backgroundColor: '#14171A',
          color: '#F2F4F7',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 500, margin: '0 0 12px' }}>Something went wrong.</h1>
        <p style={{ color: '#9CA3AF', maxWidth: 420, margin: '0 0 24px' }}>
          We&rsquo;ve been notified and are looking into it.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '10px 24px',
            backgroundColor: '#C9A227',
            color: '#14171A',
            border: 'none',
            borderRadius: 2,
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
