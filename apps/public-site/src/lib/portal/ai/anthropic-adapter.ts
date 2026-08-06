import Anthropic from '@anthropic-ai/sdk';
import type { AIContentPort, AIContentRequest, AIContentPackage, AIImageCandidate, AIImageSuggestion } from '@agp/application';
import { getIntegrationCredential } from '../integrations/store';
import { extractJson } from './json-extract';
import { contentPackagePrompt, IMAGE_TAG_PROMPT, imageSuggestionPrompt } from './prompts';
import { getBrandContext } from './brand-context';

// Real implementation, gated behind a real credential connected from
// Settings → Integrations (never a code change to enable) — written for
// real so this environment's honest "not configured" state is a
// credential gap, not a missing feature.
const DEFAULT_MODEL = 'claude-sonnet-5';

interface AICredential {
  apiKey: string;
  model?: string;
}

async function getCredential(): Promise<AICredential | null> {
  return getIntegrationCredential<AICredential>('AI_ANTHROPIC');
}

export const anthropicAIProvider: AIContentPort = {
  async isConfigured(): Promise<boolean> {
    const cred = await getCredential();
    return Boolean(cred?.apiKey);
  },

  async generateContentPackage(request: AIContentRequest): Promise<AIContentPackage> {
    const cred = await getCredential();
    if (!cred) {
      throw new Error('Anthropic provider is not configured.');
    }
    const client = new Anthropic({ apiKey: cred.apiKey });
    const response = await client.messages.create({
      model: cred.model || DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: contentPackagePrompt(request, await getBrandContext()) }],
    });
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('AI response contained no text.');
    }
    return extractJson<AIContentPackage>(textBlock.text);
  },

  async generateImageTags(imageUrl: string): Promise<readonly string[]> {
    const cred = await getCredential();
    if (!cred) {
      throw new Error('Anthropic provider is not configured.');
    }
    const client = new Anthropic({ apiKey: cred.apiKey });
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const mediaType = imageResponse.headers.get('content-type') ?? 'image/jpeg';

    const response = await client.messages.create({
      model: cred.model || DEFAULT_MODEL,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: imageBuffer.toString('base64') } },
            { type: 'text', text: IMAGE_TAG_PROMPT },
          ],
        },
      ],
    });
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('AI response contained no text.');
    }
    return extractJson<string[]>(textBlock.text);
  },

  async suggestImages(request: AIContentRequest, candidates: readonly AIImageCandidate[]): Promise<readonly AIImageSuggestion[]> {
    const cred = await getCredential();
    if (!cred) {
      throw new Error('Anthropic provider is not configured.');
    }
    if (candidates.length === 0) return [];

    const client = new Anthropic({ apiKey: cred.apiKey });
    const response = await client.messages.create({
      model: cred.model || DEFAULT_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: imageSuggestionPrompt(request, candidates) }],
    });
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('AI response contained no text.');
    }
    return extractJson<AIImageSuggestion[]>(textBlock.text);
  },
};
