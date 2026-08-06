import type { AIContentPort } from '@agp/application';
import type { IntegrationType } from '@prisma/client';
import { prisma } from '../db';
import { nullAIProvider } from './null-provider';
import { anthropicAIProvider } from './anthropic-adapter';
import { openaiAIProvider } from './openai-adapter';
import { geminiAIProvider } from './gemini-adapter';
import { openrouterAIProvider } from './openrouter-adapter';

// Config-driven provider selection — reads AISettings.defaultProvider
// (owner-set from Settings → AI, see /admin/settings/ai) rather than a
// hardcoded `import { anthropicAIProvider }` at every call site. Adding a
// fifth provider means one new adapter file implementing AIContentPort
// plus one new case here — never touching any action or UI that calls
// getActiveAIProvider().
const ADAPTERS: Partial<Record<IntegrationType, AIContentPort>> = {
  AI_ANTHROPIC: anthropicAIProvider,
  AI_OPENAI: openaiAIProvider,
  AI_GEMINI: geminiAIProvider,
  AI_OPENROUTER: openrouterAIProvider,
};

export async function getActiveAIProvider(): Promise<AIContentPort> {
  const settings = await prisma.aISettings.findFirst();
  if (!settings?.defaultProvider) return nullAIProvider;

  const adapter = ADAPTERS[settings.defaultProvider];
  if (!adapter) return nullAIProvider;

  return (await adapter.isConfigured()) ? adapter : nullAIProvider;
}
