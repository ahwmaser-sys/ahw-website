import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { getAllOffices } from '../../../../lib/portal/offices';
import { getSiteUrl } from '../../../../lib/site-config';
import { TestConnectionForm, DisconnectForm } from './TestDisconnectForms';
import {
  OAuthConnectLink,
  LinkedInFollowUpForm,
  GoogleBusinessFollowUpForm,
  GoogleAnalyticsConnectForm,
  SearchConsoleConnectForm,
  GoogleMapsConnectForm,
  EmailConnectForm,
} from './ConnectForms';
import styles from '../../../../components/portal/portal-ui.module.css';
import type { IntegrationConfig, IntegrationType, Office } from '@prisma/client';

const SOCIAL_TYPES: readonly IntegrationType[] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS'];

const LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  GOOGLE_BUSINESS: 'Google Business Profile',
  GOOGLE_ANALYTICS: 'Google Analytics',
  GOOGLE_SEARCH_CONSOLE: 'Google Search Console',
  GOOGLE_MAPS: 'Google Maps',
  SMTP_EMAIL: 'Email (Resend)',
};

type ConfigWithConnectedBy = IntegrationConfig & { connectedBy: { name: string | null; email: string } | null };

function StatusBadge({ config }: { config: ConfigWithConnectedBy | undefined }) {
  const status = config?.status ?? 'NOT_CONNECTED';
  const badgeClass =
    status === 'CONNECTED' ? styles.badgeActive : status === 'ERROR' ? styles.badgeDanger : status === 'PENDING' ? styles.badgeWarn : styles.badgeMuted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status.replace('_', ' ')}</span>;
}

// The brief's required field set for every integration card — Connected
// account/office/by/date, Scopes, Last token refresh, Last successful
// test, Last publish, Last error. "Connected account" reads from each
// connect action's own metadata (pageName/username/propertyId/siteUrl —
// whatever that platform's connect form captured), never fabricated.
function ConfigDetails({ config, officeLabel }: { config: ConfigWithConnectedBy | undefined; officeLabel?: string }) {
  if (!config) return <p className={styles.cardMeta}>Never connected.</p>;
  const metadata = (config.metadata as Record<string, unknown> | null) ?? {};
  const connectedAccount = (metadata.pageName ?? metadata.username ?? metadata.propertyId ?? metadata.siteUrl ?? metadata.model) as string | undefined;

  return (
    <div className={styles.cardMeta}>
      <p>
        {officeLabel && <>Office: <strong>{officeLabel}</strong> · </>}
        Connected account: {connectedAccount ?? '—'}
        {config.connectedBy && <> · Connected by: {config.connectedBy.name ?? config.connectedBy.email}</>}
        {config.connectedAt && <> · Connected: {config.connectedAt.toLocaleString()}</>}
      </p>
      <p>
        Scopes: {config.scopes.length > 0 ? config.scopes.join(', ') : '—'}
        {config.lastTokenRefreshAt && <> · Last token refresh: {config.lastTokenRefreshAt.toLocaleString()}</>}
      </p>
      <p>
        {config.lastSuccessAt ? `Last successful test: ${config.lastSuccessAt.toLocaleString()}` : 'No successful test yet.'}
        {config.lastPublishAt && <> · Last publish: {config.lastPublishAt.toLocaleString()}</>}
      </p>
      {(config.lastError || config.lastPublishError) && (
        <p className={styles.errorMessage} role="alert">{config.lastPublishError ?? config.lastError}</p>
      )}
    </div>
  );
}

function ViewLogsLink({ entityId }: { entityId: string }) {
  return (
    <a href={`/admin/settings/integrations/logs?entityId=${encodeURIComponent(entityId)}`} className={styles.linkButton}>
      View Logs
    </a>
  );
}

export default async function AdminIntegrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const principal = await requireSuperAdminPage();
  const params = await searchParams;

  const [configs, offices, siteUrl] = await Promise.all([
    prisma.integrationConfig.findMany({ include: { connectedBy: { select: { name: true, email: true } } } }),
    getAllOffices(),
    getSiteUrl(),
  ]);

  const socialByOfficeAndType = new Map<string, ConfigWithConnectedBy>();
  const companyWideByType = new Map<string, ConfigWithConnectedBy>();
  for (const config of configs) {
    if (config.officeId) {
      socialByOfficeAndType.set(`${config.officeId}:${config.type}`, config);
    } else {
      companyWideByType.set(config.type, config);
    }
  }

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Integrations</h1>
      </div>
      <p className={styles.subtitle}>
        Connect, test, and disconnect every external service from here — no <code>.env</code> editing needed for
        day-to-day operation. Each office connects its own social accounts independently. Whether a connected
        account actually participates in publishing is a <a href="/admin/publishing">Publishing</a> setting, not an
        Integrations one. The one exception here: each OAuth platform&apos;s own developer app (Client ID/Secret) is
        a one-time infrastructure step set in environment variables when the app is deployed, not something
        reconnected here day to day.
      </p>

      {params.connected && <p className={styles.successMessage} role="status">{params.connected.replace('_', ' ')} connected.</p>}
      {params.error && <p className={styles.errorMessage} role="alert">{decodeURIComponent(params.error)}</p>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Per-office social accounts</h2>
        <div className={styles.cardList}>
          {offices.flatMap((office: Office) =>
            SOCIAL_TYPES.map((type) => {
              const config = socialByOfficeAndType.get(`${office.id}:${type}`);
              const needsFollowUp = config?.status === 'PENDING' && (config.metadata as { needsFollowUp?: boolean } | null)?.needsFollowUp;
              const entityId = `${type}:${office.id}`;
              return (
                <div key={entityId} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <strong>{office.displayName} — {LABELS[type]}</strong>
                    <StatusBadge config={config} />
                  </div>
                  <ConfigDetails config={config} />
                  {needsFollowUp && (type === 'LINKEDIN' ? <LinkedInFollowUpForm officeId={office.id} /> : <GoogleBusinessFollowUpForm officeId={office.id} />)}
                  <div className={styles.buttonRow}>
                    {config?.status === 'CONNECTED' || config?.status === 'ERROR' ? (
                      <>
                        <TestConnectionForm type={type} officeId={office.id} />
                        <DisconnectForm type={type} officeId={office.id} />
                      </>
                    ) : !needsFollowUp ? (
                      <OAuthConnectLink type={type} officeId={office.id} />
                    ) : null}
                    <ViewLogsLink entityId={entityId} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Company-wide services</h2>
        <div className={styles.cardList}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{LABELS.GOOGLE_ANALYTICS}</strong>
              <StatusBadge config={companyWideByType.get('GOOGLE_ANALYTICS')} />
            </div>
            <ConfigDetails config={companyWideByType.get('GOOGLE_ANALYTICS')} />
            <p className={styles.cardMeta}>
              Authenticated via a service account (Google&apos;s documented pattern for server-side reporting access) —
              grant it Viewer access on the GA4 property after connecting.
            </p>
            {companyWideByType.get('GOOGLE_ANALYTICS')?.status === 'CONNECTED' || companyWideByType.get('GOOGLE_ANALYTICS')?.status === 'ERROR' ? (
              <div className={styles.buttonRow}>
                <TestConnectionForm type="GOOGLE_ANALYTICS" />
                <DisconnectForm type="GOOGLE_ANALYTICS" />
                <ViewLogsLink entityId="GOOGLE_ANALYTICS" />
              </div>
            ) : (
              <GoogleAnalyticsConnectForm />
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{LABELS.GOOGLE_SEARCH_CONSOLE}</strong>
              <StatusBadge config={companyWideByType.get('GOOGLE_SEARCH_CONSOLE')} />
            </div>
            <ConfigDetails config={companyWideByType.get('GOOGLE_SEARCH_CONSOLE')} />
            <p className={styles.cardMeta}>Same service-account pattern as Analytics — add it as an Owner on the property in Search Console.</p>
            {companyWideByType.get('GOOGLE_SEARCH_CONSOLE')?.status === 'CONNECTED' || companyWideByType.get('GOOGLE_SEARCH_CONSOLE')?.status === 'ERROR' ? (
              <div className={styles.buttonRow}>
                <TestConnectionForm type="GOOGLE_SEARCH_CONSOLE" />
                <DisconnectForm type="GOOGLE_SEARCH_CONSOLE" />
                <ViewLogsLink entityId="GOOGLE_SEARCH_CONSOLE" />
              </div>
            ) : (
              <SearchConsoleConnectForm siteUrl={siteUrl} />
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{LABELS.GOOGLE_MAPS}</strong>
              <StatusBadge config={companyWideByType.get('GOOGLE_MAPS')} />
            </div>
            <ConfigDetails config={companyWideByType.get('GOOGLE_MAPS')} />
            <p className={styles.cardMeta}>Not currently consumed by any public page — reserved for future use (e.g. an office-location map).</p>
            {companyWideByType.get('GOOGLE_MAPS')?.status === 'CONNECTED' || companyWideByType.get('GOOGLE_MAPS')?.status === 'ERROR' ? (
              <div className={styles.buttonRow}>
                <TestConnectionForm type="GOOGLE_MAPS" />
                <DisconnectForm type="GOOGLE_MAPS" />
                <ViewLogsLink entityId="GOOGLE_MAPS" />
              </div>
            ) : (
              <GoogleMapsConnectForm />
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{LABELS.SMTP_EMAIL}</strong>
              <StatusBadge config={companyWideByType.get('SMTP_EMAIL')} />
            </div>
            <ConfigDetails config={companyWideByType.get('SMTP_EMAIL')} />
            <p className={styles.cardMeta}>Powers password reset, email verification, and portal notification emails.</p>
            {companyWideByType.get('SMTP_EMAIL')?.status === 'CONNECTED' || companyWideByType.get('SMTP_EMAIL')?.status === 'ERROR' ? (
              <div className={styles.buttonRow}>
                <TestConnectionForm type="SMTP_EMAIL" />
                <DisconnectForm type="SMTP_EMAIL" />
                <ViewLogsLink entityId="SMTP_EMAIL" />
              </div>
            ) : (
              <EmailConnectForm />
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
