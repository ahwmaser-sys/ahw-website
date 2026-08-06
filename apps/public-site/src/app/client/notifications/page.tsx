import type { Metadata } from 'next';
import { requireClientPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { CLIENT_NAV_LINKS } from '../nav-links';
import { MarkReadButton } from './MarkReadButton';
import styles from '../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default async function ClientNotificationsPage() {
  const principal = await requireClientPage();

  // Scoped directly by userId in the query, same principle as the
  // project detail page — never fetched broadly and filtered client-side.
  const notifications = await prisma.notification.findMany({
    where: { userId: principal.userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <PortalShell brand="AHW Client Portal" navLinks={CLIENT_NAV_LINKS} userLabel="Client">
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Notifications</h1>
      </div>

      <div className={styles.cardList}>
        {notifications.length === 0 && <p className={styles.cardMeta}>No notifications yet.</p>}
        {notifications.map((notification) => (
          <div key={notification.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{notification.title}</strong>
              {!notification.readAt && <span className={`${styles.badge} ${styles.badgeWarn}`}>New</span>}
            </div>
            <p>{notification.body}</p>
            <span className={styles.cardMeta}>{formatDate(notification.createdAt)}</span>
            {!notification.readAt && <MarkReadButton notificationId={notification.id} />}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
