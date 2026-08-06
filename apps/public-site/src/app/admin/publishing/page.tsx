import { requireSuperAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { getAllOffices } from '../../../lib/portal/offices';
import { PublishToggleForm } from './PublishToggleForm';
import styles from '../../../components/portal/portal-ui.module.css';
import type { SocialPlatform } from '@prisma/client';

const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'GOOGLE_BUSINESS', label: 'Google Business Profile' },
];

// The office × platform participation matrix — a Marketing concern
// (does this office's account take part in dispatch at all when a post's
// "Publish to" includes it), deliberately separate from Settings →
// Integrations (whether the underlying credential is connected). See
// lib/portal/actions/publishing-destinations.ts's togglePublishingDestination.
export default async function AdminPublishingPage() {
  const principal = await requireSuperAdminPage();

  const [offices, destinations, configs] = await Promise.all([
    getAllOffices(),
    prisma.publishingDestination.findMany(),
    prisma.integrationConfig.findMany({ where: { type: { in: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS'] } } }),
  ]);

  const destinationKey = (officeId: string, platform: string) => `${officeId}:${platform}`;
  const destinationByKey = new Map(destinations.map((d) => [destinationKey(d.officeId, d.platform), d]));
  const configByKey = new Map(configs.map((c) => [destinationKey(c.officeId ?? '', c.type), c]));

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Publishing</h1>
      </div>
      <p className={styles.subtitle}>
        Which office&apos;s connected account takes part in publishing, per platform — independent of the credential
        itself (that&apos;s <a href="/admin/settings/integrations">Settings → Integrations</a>). A News Post&apos;s own
        &quot;Publish to&quot; selection (All Offices / Selected Offices) narrows this further per post.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Office</th>
              <th>Platform</th>
              <th>Credential</th>
              <th>Participates in dispatch</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {offices.flatMap((office) =>
              PLATFORMS.map(({ value: platform, label }) => {
                const key = destinationKey(office.id, platform);
                const destination = destinationByKey.get(key);
                const config = configByKey.get(key);
                const isEnabled = destination?.isEnabled ?? false;
                const connected = config?.status === 'CONNECTED';
                return (
                  <tr key={key}>
                    <td>{office.displayName}</td>
                    <td>{label}</td>
                    <td>
                      <span className={`${styles.badge} ${connected ? styles.badgeActive : styles.badgeMuted}`}>
                        {connected ? 'Connected — Auto mode' : 'Not connected — Manual mode'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${isEnabled ? styles.badgeActive : styles.badgeMuted}`}>
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <PublishToggleForm officeId={office.id} platform={platform} isEnabled={isEnabled} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
