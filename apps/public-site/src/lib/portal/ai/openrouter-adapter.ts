import type { AIContentPort, AIContentRequest, AIContentPackage, AIImageCandidate, AIImageSuggestion } from '@agp/application';
import { getIntegrationCredential } from '../integrations/store';
import { extractJson } from './json-extract';
import { contentPackagePrompt, IMAGE_TAG_PROMPT, imageSuggestionPrompt } from './prompts';
import { getBrandContext } from './brand-context';
import { getSiteUrl } from '../../site-config';

// OpenRouter is a single OpenAI-compatible gateway in front of many
// vendors' models — unlike the other three adapters, there's no sane
// built-in default model (a key without a chosen model is meaningless
// here), so `model` is required at connect time, not merely an override.
const API = 'https://openrouter.ai/api/v1/chat/completions';

interface AICredential {
  apiKey: string;
  model: string;
}

async function getCredential(): Promise<AICredential | null> {
  return getIntegrationCredential<AICredential>('AI_OPENROUTER');
}

async function chat(cred: AICredential, content: unknown): Promise<string> {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cred.apiKey}`,
      'HTTP-Referer': await getSiteUrl(),
      'X-Title': 'AHW Architects Marketing Studio',
    },
    body: JSON.stringify({ model: cred.model, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter request failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenRouter response contained no text.');
  }
  return text;
}

export const openrouterAIProvider: AIContentPort = {
  async isConfigured(): Promise<boolean> {
    const cred = await getCredential();
    return Boolean(cred?.apiKey && cred.model);
  },

  async generateContentPackage(request: AIContentRequest): Promise<AIContentPackage> {
    const cred = await getCredential();
    if (!cred) throw new Error('OpenRouter provider is not configured.');
    const text = await chat(cred, contentPackagePrompt(request, await getBrandContext()));
    return extractJson<AIContentPackage>(text);
  },

  async generateImageTags(imageUrl: string): Promise<readonly string[]> {
    const cred = await getCredential();
    if (!cred) throw new Error('OpenRouter provider is not configured.');
    const text = await chat(cred, [
      { type: 'text', text: IMAGE_TAG_PROMPT },
      { type: 'image_url', image_url: { url: imageUrl } },
    ]);
    return extractJson<string[]>(text);
  },

  async suggestImages(request: AIContentRequest, candidates: readonly AIImageCandidate[]): Promise<readonly AIImageSuggestion[]> {
    const cred = await getCredential();
    if (!cred) throw new Error('OpenRouter provider is not configured.');
    if (candidates.length === 0) return [];
    const text = await chat(cred, imageSuggestionPrompt(request, candidates));
    return extractJson<AIImageSuggestion[]>(text);
  },
};
