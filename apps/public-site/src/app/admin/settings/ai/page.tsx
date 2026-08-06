import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { getActiveAIProvider } from '../../../../lib/portal/ai/registry';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { TestConnectionForm, DisconnectForm } from '../integrations/TestDisconnectForms';
import { ConnectAIProviderForm } from './ConnectAIProviderForm';
import { DefaultProviderForm } from './DefaultProviderForm';
import styles from '../../../../components/portal/portal-ui.module.css';
import type { IntegrationConfig } from '@prisma/client';

const PROVIDERS: { type: 'AI_ANTHROPIC' | 'AI_OPENAI' | 'AI_GEMINI' | 'AI_OPENROUTER'; label: string; modelPlaceholder: string; modelRequired?: boolean }[] = [
  { type: 'AI_ANTHROPIC', label: 'Anthropic', modelPlaceholder: 'claude-sonnet-5' },
  { type: 'AI_OPENAI', label: 'OpenAI', modelPlaceholder: 'gpt-4o-mini' },
  { type: 'AI_GEMINI', label: 'Google Gemini', modelPlaceholder: 'gemini-2.0-flash' },
  { type: 'AI_OPENROUTER', label: 'OpenRouter', modelPlaceholder: 'anthropic/claude-3.5-sonnet', modelRequired: true },
];

function StatusBadge({ config }: { config: IntegrationConfig | undefined }) {
  const status = config?.status ?? 'NOT_CONNECTED';
  const badgeClass = status === 'CONNECTED' ? styles.badgeActive : status === 'ERROR' ? styles.badgeDanger : styles.badgeMuted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status.replace('_', ' ')}</span>;
}

export default async function AdminAISettingsPage() {
  const principal = await requireSuperAdminPage();

  const configs = await prisma.integrationConfig.findMany();
  const byType = new Map(configs.map((c) => [c.type, c]));
  const settings = await prisma.aISettings.findFirst();
  const activeProvider = await getActiveAIProvider();
  const isReady = await activeProvider.isConfigured();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>AI Providers</h1>
        <span className={`${styles.badge} ${isReady ? styles.badgeActive : styles.badgeMuted}`}>
          AI Marketing Assistant: {isReady ? 'Ready' : 'Not configured'}
        </span>
      </div>
      <p className={styles.subtitle}>
        Connect one or more providers, then pick the default the AI Marketing Assistant uses for SEO titles, meta
        descriptions, alt text, captions, hashtags, keywords, CTAs, and image tagging. Without a connected default
        provider, every &quot;Generate&quot; button across the admin panel shows an honest &quot;not configured&quot;
        message instead of fabricated content.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Default provider</h2>
        <DefaultProviderForm defaultProvider={settings?.defaultProvider ?? null} defaultModel={settings?.defaultModel ?? null} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Providers</h2>
        <div className={styles.cardList}>
          {PROVIDERS.map((p) => {
            const config = byType.get(p.type);
            return (
              <div key={p.type} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong>{p.label}</strong>
                  <StatusBadge config={config} />
                </div>
                <p className={styles.cardMeta}>
                  {config?.lastSuccessAt ? `Last successful test: ${config.lastSuccessAt.toLocaleString()}` : 'Never tested.'}
                  {config?.lastError && ` · ${config.lastError}`}
                </p>
                {config?.status === 'CONNECTED' || config?.status === 'ERROR' ? (
                  <div className={styles.buttonRow}>
                    <TestConnectionForm type={p.type} />
                    <DisconnectForm type={p.type} />
                  </div>
                ) : (
                  <ConnectAIProviderForm type={p.type} modelPlaceholder={p.modelPlaceholder} modelRequired={p.modelRequired ?? false} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PortalShell>
  );
}
