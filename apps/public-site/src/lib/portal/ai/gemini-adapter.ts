import type { AIContentPort, AIContentRequest, AIContentPackage, AIImageCandidate, AIImageSuggestion } from '@agp/application';
import { getIntegrationCredential } from '../integrations/store';
import { extractJson } from './json-extract';
import { contentPackagePrompt, IMAGE_TAG_PROMPT, imageSuggestionPrompt } from './prompts';
import { getBrandContext } from './brand-context';

const DEFAULT_MODEL = 'gemini-2.0-flash';

interface AICredential {
  apiKey: string;
  model?: string;
}

async function getCredential(): Promise<AICredential | null> {
  return getIntegrationCredential<AICredential>('AI_GEMINI');
}

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

async function generate(cred: AICredential, parts: GeminiPart[]): Promise<string> {
  const model = cred.model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cred.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini response contained no text.');
  }
  return text;
}

export const geminiAIProvider: AIContentPort = {
  async isConfigured(): Promise<boolean> {
    const cred = await getCredential();
    return Boolean(cred?.apiKey);
  },

  async generateContentPackage(request: AIContentRequest): Promise<AIContentPackage> {
    const cred = await getCredential();
    if (!cred) throw new Error('Gemini provider is not configured.');
    const text = await generate(cred, [{ text: contentPackagePrompt(request, await getBrandContext()) }]);
    return extractJson<AIContentPackage>(text);
  },

  async generateImageTags(imageUrl: string): Promise<readonly string[]> {
    const cred = await getCredential();
    if (!cred) throw new Error('Gemini provider is not configured.');
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const mimeType = imageResponse.headers.get('content-type') ?? 'image/jpeg';
    const text = await generate(cred, [
      { text: IMAGE_TAG_PROMPT },
      { inline_data: { mime_type: mimeType, data: imageBuffer.toString('base64') } },
    ]);
    return extractJson<string[]>(text);
  },

  async suggestImages(request: AIContentRequest, candidates: readonly AIImageCandidate[]): Promise<readonly AIImageSuggestion[]> {
    const cred = await getCredential();
    if (!cred) throw new Error('Gemini provider is not configured.');
    if (candidates.length === 0) return [];
    const text = await generate(cred, [{ text: imageSuggestionPrompt(request, candidates) }]);
    return extractJson<AIImageSuggestion[]>(text);
  },
};
