import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '../../../lib/portal/db';
import styles from '../../status.module.css';
import localStyles from './page.module.css';

// Reuses the exact same status-page pattern as the site's own not-found
// page (apps/public-site/src/app/not-found.tsx) — same tokens, same
// layout, no second design language. Content is now settings-driven
// (Settings → Client Portal): a maintenance-mode outage reads
// differently from "not launched yet," and the owner's welcome message
// and support contact — when set — replace the generic copy below.
export const metadata: Metadata = {
  title: 'Client Portal — Coming Soon',
  robots: { index: false, follow: false },
};

export default async function ClientComingSoon() {
  const settings = await prisma.portalSettings.findFirst().catch(() => null);
  const isMaintenance = Boolean(settings?.enabled && settings.maintenanceMode);

  return (
    <main className={`${styles.main} ${localStyles.main}`}>
      <span className={styles.code}>{isMaintenance ? 'Maintenance' : 'Coming Soon'}</span>
      <h1 className={styles.title}>
        {isMaintenance ? 'The Client Portal is briefly offline.' : 'The Client Portal is being built.'}
      </h1>
      <p className={styles.description}>
        {settings?.welcomeMessage ||
          (isMaintenance
            ? "We're making some updates and will be back shortly. In the meantime, reach out directly and our team will keep you updated."
            : 'Project updates, documents, and progress tracking for AHW clients will live here. In the meantime, reach out directly and our team will keep you updated.')}
      </p>
      {(settings?.supportEmail || settings?.supportPhone) && (
        <p className={styles.description}>
          {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>}
          {settings.supportEmail && settings.supportPhone && ' · '}
          {settings.supportPhone && <a href={`tel:${settings.supportPhone}`}>{settings.supportPhone}</a>}
        </p>
      )}
      <div className={styles.actions}>
        <Link href="/" className={styles.primaryAction}>
          Back to Home
        </Link>
        <Link href="/contact" className={styles.secondaryAction}>
          Contact Us
        </Link>
      </div>
    </main>
  );
}
