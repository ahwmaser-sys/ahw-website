import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import type { IntegrationType } from '@prisma/client';
import { prisma } from './db';

// Company-wide integrations (Email, AI providers) are always the
// `officeId: null` row. Looked up with findFirst rather than the
// type_officeId compound-unique shorthand — Prisma's query engine
// rejects `officeId: null` there ("Argument officeId must not be
// null"), even though the column itself is nullable and a plain filter
// like the one below accepts null correctly.
const COMPANY_WIDE_OFFICE_ID = null;

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'OFFLINE';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  detail: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const ms = Date.now() - start;
    return { name: 'Database', status: ms < 500 ? 'HEALTHY' : 'WARNING', detail: `Responded in ${ms}ms.` };
  } catch (error) {
    return { name: 'Database', status: 'OFFLINE', detail: error instanceof Error ? error.message : 'Unreachable.' };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const probePath = join(process.cwd(), 'storage', 'portal', '.health-check');
  try {
    await writeFile(probePath, String(Date.now()));
    await unlink(probePath);
    return { name: 'Storage', status: 'HEALTHY', detail: 'Local filesystem is writable.' };
  } catch (error) {
    return { name: 'Storage', status: 'OFFLINE', detail: error instanceof Error ? error.message : 'Not writable.' };
  }
}

// email.ts's
// sendEmail() already falls back to process.env.RESEND_API_KEY when no
// IntegrationConfig row is connected (see getApiKey() there), so email
// sending can be genuinely working via the env var alone — reporting
// that as "Not connected" here would be a false alarm. This check
// reflects both real paths rather than only the DB-tracked one.
async function checkEmail(): Promise<HealthCheck> {
  const config = await prisma.integrationConfig.findFirst({ where: { type: 'SMTP_EMAIL', officeId: COMPANY_WIDE_OFFICE_ID } });
  if (config?.status === 'CONNECTED') {
    return { name: 'Email (Resend)', status: 'HEALTHY', detail: config.lastSuccessAt ? `Last verified ${config.lastSuccessAt.toLocaleString()}.` : 'Connected via Settings → Integrations, not yet tested.' };
  }
  if (config?.status === 'ERROR') {
    return { name: 'Email (Resend)', status: 'OFFLINE', detail: config.lastError ?? 'Last test failed.' };
  }
  if (process.env.RESEND_API_KEY) {
    return { name: 'Email (Resend)', status: 'HEALTHY', detail: 'Using the RESEND_API_KEY environment variable — connect in Settings → Integrations to manage the key from the admin panel instead.' };
  }
  return { name: 'Email (Resend)', status: 'WARNING', detail: 'Not connected.' };
}

async function checkSocialPublishing(): Promise<HealthCheck> {
  const platforms: IntegrationType[] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS'];
  const [configs, officeCount] = await Promise.all([
    prisma.integrationConfig.findMany({ where: { type: { in: platforms } } }),
    prisma.office.count({ where: { status: 'ACTIVE' } }),
  ]);
  const connected = configs.filter((c) => c.status === 'CONNECTED').length;
  const possible = platforms.length * Math.max(officeCount, 1);
  if (connected === 0) {
    return { name: 'Social Publishing', status: 'WARNING', detail: 'No office has a platform connected — all publishing is Manual mode.' };
  }
  return { name: 'Social Publishing', status: 'HEALTHY', detail: `${connected}/${possible} office×platform connection(s) active across ${officeCount} office(s).` };
}

async function checkAnalytics(): Promise<HealthCheck> {
  const configs = await prisma.integrationConfig.findMany({ where: { type: { in: ['GOOGLE_ANALYTICS', 'GOOGLE_SEARCH_CONSOLE'] } } });
  const connected = configs.filter((c) => c.status === 'CONNECTED').length;
  if (connected === 0) {
    return { name: 'Analytics', status: 'WARNING', detail: 'GA4/Search Console not connected — self-hosted content analytics still works.' };
  }
  return { name: 'Analytics', status: 'HEALTHY', detail: `${connected}/2 external analytics source(s) connected.` };
}

function checkBackgroundServices(): HealthCheck {
  // Honest, not a placeholder: this app genuinely has no background job
  // runner (no queue, no cron worker process) — scheduled article
  // publishing and retryable social posts run inline, triggered by the
  // next relevant admin page load or an explicit Retry click. Documented
  // the same way in social.ts's retrySocialPost and news.ts's scheduling
  // sweep; surfaced here rather than fabricating a "worker" status.
  return { name: 'Background Services', status: 'WARNING', detail: 'No background worker process — scheduled/retry actions run on next relevant page load or manual retry, not on a timer.' };
}

async function checkAI(): Promise<HealthCheck> {
  const settings = await prisma.aISettings.findFirst();
  if (!settings?.defaultProvider) {
    return { name: 'AI Marketing Assistant', status: 'WARNING', detail: 'No default provider set.' };
  }
  const config = await prisma.integrationConfig.findFirst({ where: { type: settings.defaultProvider, officeId: COMPANY_WIDE_OFFICE_ID } });
  if (config?.status === 'CONNECTED') {
    return { name: 'AI Marketing Assistant', status: 'HEALTHY', detail: `${settings.defaultProvider.replace('AI_', '')} connected.` };
  }
  return { name: 'AI Marketing Assistant', status: 'WARNING', detail: 'Default provider selected but not connected.' };
}

export async function runHealthChecks(): Promise<HealthCheck[]> {
  return Promise.all([
    checkDatabase(),
    checkStorage(),
    checkEmail(),
    checkAI(),
    checkSocialPublishing(),
    checkAnalytics(),
    Promise.resolve(checkBackgroundServices()),
  ]);
}
