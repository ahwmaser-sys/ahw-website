'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { IntegrationType } from '@prisma/client';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { connectIntegration, disconnectIntegration, getIntegrationCredential, recordIntegrationTest } from '../integrations/store';
import { testIntegration } from '../integrations/test';
import type { GoogleServiceAccountKey } from '../integrations/google-service-account';
import type { ActionState } from '../../../components/portal/ActionForm';

const SETTINGS_PATH = '/admin/settings/integrations';

function parseServiceAccountJson(raw: string): GoogleServiceAccountKey {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Service account key must be valid JSON — paste the entire downloaded key file.');
  }
  const obj = parsed as Partial<GoogleServiceAccountKey>;
  if (!obj.client_email || !obj.private_key) {
    throw new Error('Service account JSON is missing client_email or private_key.');
  }
  return { client_email: obj.client_email, private_key: obj.private_key };
}

async function connectAndRecord(
  type: IntegrationType,
  credential: unknown,
  metadata: Record<string, unknown>,
  actorId: string
): Promise<void> {
  // Company-wide only (GA4/GSC/Maps/Email/AI providers) — social platforms
  // go through the office-scoped OAuth start/callback routes instead,
  // never this helper.
  await connectIntegration(type, credential, { metadata, connectedById: actorId });
  await recordActivity({ actorId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: type });
  revalidatePath(SETTINGS_PATH);
}

const gaSchema = z.object({
  propertyId: z.string().trim().min(1, 'Property ID is required.'),
  serviceAccountJson: z.string().trim().min(1, 'Service account JSON is required.'),
});

export async function connectGoogleAnalytics(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = gaSchema.safeParse({ propertyId: formData.get('propertyId'), serviceAccountJson: formData.get('serviceAccountJson') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  try {
    const serviceAccountKey = parseServiceAccountJson(parsed.data.serviceAccountJson);
    await connectAndRecord('GOOGLE_ANALYTICS', { propertyId: parsed.data.propertyId, serviceAccountKey }, { propertyId: parsed.data.propertyId }, principal.userId);
    return { success: 'Google Analytics connected. Grant this service account Viewer access on the GA4 property, then Test Connection.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Connection failed.' };
  }
}

const gscSchema = z.object({
  siteUrl: z.string().trim().min(1, 'Site URL is required.'),
  serviceAccountJson: z.string().trim().min(1, 'Service account JSON is required.'),
});

export async function connectSearchConsole(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = gscSchema.safeParse({ siteUrl: formData.get('siteUrl'), serviceAccountJson: formData.get('serviceAccountJson') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  try {
    const serviceAccountKey = parseServiceAccountJson(parsed.data.serviceAccountJson);
    await connectAndRecord('GOOGLE_SEARCH_CONSOLE', { siteUrl: parsed.data.siteUrl, serviceAccountKey }, { siteUrl: parsed.data.siteUrl }, principal.userId);
    return { success: 'Search Console connected. Add this service account as an Owner on the property in Search Console, then Test Connection.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Connection failed.' };
  }
}

const mapsSchema = z.object({ apiKey: z.string().trim().min(1, 'API key is required.') });

export async function connectGoogleMaps(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = mapsSchema.safeParse({ apiKey: formData.get('apiKey') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  await connectAndRecord('GOOGLE_MAPS', { apiKey: parsed.data.apiKey }, {}, principal.userId);
  return { success: 'Google Maps API key saved.' };
}

const emailSchema = z.object({ apiKey: z.string().trim().min(1, 'API key is required.') });

export async function connectEmail(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = emailSchema.safeParse({ apiKey: formData.get('apiKey') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  await connectAndRecord('SMTP_EMAIL', { apiKey: parsed.data.apiKey }, {}, principal.userId);
  return { success: 'Email (Resend) API key saved.' };
}

const aiSchema = z.object({
  type: z.enum(['AI_ANTHROPIC', 'AI_OPENAI', 'AI_GEMINI', 'AI_OPENROUTER']),
  apiKey: z.string().trim().min(1, 'API key is required.'),
  model: z.string().trim().optional(),
});

export async function connectAIProvider(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = aiSchema.safeParse({ type: formData.get('type'), apiKey: formData.get('apiKey'), model: formData.get('model') || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  if (parsed.data.type === 'AI_OPENROUTER' && !parsed.data.model) {
    return { error: 'OpenRouter requires a model id (e.g. anthropic/claude-3.5-sonnet) — it proxies many vendors, so there is no default.' };
  }
  await connectAndRecord(parsed.data.type, { apiKey: parsed.data.apiKey, model: parsed.data.model }, { model: parsed.data.model }, principal.userId);
  return { success: 'Provider connected.' };
}

const linkedinFollowUpSchema = z.object({
  organizationId: z.string().trim().min(1, 'Organization ID is required.'),
  officeId: z.string().trim().min(1, 'Office is required.'),
});

export async function completeLinkedInConnection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = linkedinFollowUpSchema.safeParse({ organizationId: formData.get('organizationId'), officeId: formData.get('officeId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const existing = await getIntegrationCredential<{ accessToken: string }>('LINKEDIN', parsed.data.officeId);
  if (!existing) return { error: 'Connect via OAuth first.' };

  await connectIntegration('LINKEDIN', { ...existing, organizationId: parsed.data.organizationId }, { metadata: { needsFollowUp: false }, connectedById: principal.userId, officeId: parsed.data.officeId });
  await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: `LINKEDIN:${parsed.data.officeId}` });
  revalidatePath(SETTINGS_PATH);
  return { success: 'LinkedIn connection completed.' };
}

const gbpFollowUpSchema = z.object({
  locationId: z.string().trim().min(1, 'Location ID is required.'),
  officeId: z.string().trim().min(1, 'Office is required.'),
});

export async function completeGoogleBusinessConnection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = gbpFollowUpSchema.safeParse({ locationId: formData.get('locationId'), officeId: formData.get('officeId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const existing = await getIntegrationCredential<{ accessToken: string }>('GOOGLE_BUSINESS', parsed.data.officeId);
  if (!existing) return { error: 'Connect via OAuth first.' };

  await connectIntegration('GOOGLE_BUSINESS', { ...existing, locationId: parsed.data.locationId }, { metadata: { needsFollowUp: false }, connectedById: principal.userId, officeId: parsed.data.officeId });
  await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: `GOOGLE_BUSINESS:${parsed.data.officeId}` });
  revalidatePath(SETTINGS_PATH);
  return { success: 'Google Business Profile connection completed.' };
}

const SOCIAL_TYPES = new Set<IntegrationType>(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS']);

const typeSchema = z.object({
  type: z.enum([
    'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS', 'GOOGLE_ANALYTICS', 'GOOGLE_SEARCH_CONSOLE',
    'GOOGLE_MAPS', 'SMTP_EMAIL', 'AI_ANTHROPIC', 'AI_OPENAI', 'AI_GEMINI', 'AI_OPENROUTER',
  ]),
  officeId: z.string().trim().optional(),
});

export async function disconnectIntegrationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = typeSchema.safeParse({ type: formData.get('type'), officeId: formData.get('officeId') || undefined });
  if (!parsed.success) return { error: 'Invalid request.' };
  if (SOCIAL_TYPES.has(parsed.data.type) && !parsed.data.officeId) return { error: 'Missing office context.' };

  await disconnectIntegration(parsed.data.type, parsed.data.officeId ?? null);
  await recordActivity({
    actorId: principal.userId,
    action: 'admin.integration_disconnected',
    entityType: 'IntegrationConfig',
    entityId: parsed.data.officeId ? `${parsed.data.type}:${parsed.data.officeId}` : parsed.data.type,
  });
  revalidatePath(SETTINGS_PATH);
  return { success: 'Disconnected.' };
}

export async function testIntegrationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = typeSchema.safeParse({ type: formData.get('type'), officeId: formData.get('officeId') || undefined });
  if (!parsed.success) return { error: 'Invalid request.' };
  if (SOCIAL_TYPES.has(parsed.data.type) && !parsed.data.officeId) return { error: 'Missing office context.' };

  let result;
  try {
    result = await testIntegration(parsed.data.type, parsed.data.officeId ?? null);
  } catch (error) {
    result = { ok: false, error: error instanceof Error ? error.message : 'Test failed unexpectedly.' };
  }
  await recordIntegrationTest(parsed.data.type, result, parsed.data.officeId ?? null);
  revalidatePath(SETTINGS_PATH);
  return result.ok ? { success: 'Connection test passed.' } : { error: `Connection test failed: ${result.error}` };
}

const aiSettingsSchema = z.object({
  defaultProvider: z.enum(['AI_ANTHROPIC', 'AI_OPENAI', 'AI_GEMINI', 'AI_OPENROUTER', '']),
  defaultModel: z.string().trim().optional(),
});

export async function updateAISettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = aiSettingsSchema.safeParse({
    defaultProvider: formData.get('defaultProvider') || '',
    defaultModel: formData.get('defaultModel') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const provider = parsed.data.defaultProvider || null;
  const existing = await prisma.aISettings.findFirst();
  if (existing) {
    await prisma.aISettings.update({ where: { id: existing.id }, data: { defaultProvider: provider, defaultModel: parsed.data.defaultModel ?? null } });
  } else {
    await prisma.aISettings.create({ data: { defaultProvider: provider, defaultModel: parsed.data.defaultModel ?? null } });
  }
  await recordActivity({ actorId: principal.userId, action: 'admin.ai_default_provider_updated', metadata: { provider: provider ?? 'none' } });
  revalidatePath('/admin/settings/ai');
  return { success: 'AI Marketing Assistant default provider updated.' };
}
