import type { AIContentPort, AIContentRequest, AIContentPackage, AIImageCandidate, AIImageSuggestion } from '@agp/application';
import { getIntegrationCredential } from '../integrations/store';
import { extractJson } from './json-extract';
import { contentPackagePrompt, IMAGE_TAG_PROMPT, imageSuggestionPrompt } from './prompts';
import { getBrandContext } from './brand-context';

const DEFAULT_MODEL = 'gpt-4o-mini';
const API = 'https://api.openai.com/v1/chat/completions';

interface AICredential {
  apiKey: string;
  model?: string;
}

async function getCredential(): Promise<AICredential | null> {
  return getIntegrationCredential<AICredential>('AI_OPENAI');
}

async function chat(cred: AICredential, content: unknown): Promise<string> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cred.apiKey}` },
    body: JSON.stringify({
      model: cred.model || DEFAULT_MODEL,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI response contained no text.');
  }
  return text;
}

export const openaiAIProvider: AIContentPort = {
  async isConfigured(): Promise<boolean> {
    const cred = await getCredential();
    return Boolean(cred?.apiKey);
  },

  async generateContentPackage(request: AIContentRequest): Promise<AIContentPackage> {
    const cred = await getCredential();
    if (!cred) throw new Error('OpenAI provider is not configured.');
    const text = await chat(cred, contentPackagePrompt(request, await getBrandContext()));
    return extractJson<AIContentPackage>(text);
  },

  async generateImageTags(imageUrl: string): Promise<readonly string[]> {
    const cred = await getCredential();
    if (!cred) throw new Error('OpenAI provider is not configured.');
    const text = await chat(cred, [
      { type: 'text', text: IMAGE_TAG_PROMPT },
      { type: 'image_url', image_url: { url: imageUrl } },
    ]);
    return extractJson<string[]>(text);
  },

  async suggestImages(request: AIContentRequest, candidates: readonly AIImageCandidate[]): Promise<readonly AIImageSuggestion[]> {
    const cred = await getCredential();
    if (!cred) throw new Error('OpenAI provider is not configured.');
    if (candidates.length === 0) return [];
    const text = await chat(cred, imageSuggestionPrompt(request, candidates));
    return extractJson<AIImageSuggestion[]>(text);
  },
};
