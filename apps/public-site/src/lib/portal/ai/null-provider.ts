import type { AIContentPort, AIContentRequest, AIContentPackage, AIImageCandidate, AIImageSuggestion } from '@agp/application';

// The default provider when nothing is configured — every method throws
// a clear, specific error rather than returning fabricated content. This
// is the concrete enforcement of the Honesty Lock for AI features: a
// button that says "Generate" must fail loudly, in a way the UI surfaces
// as "AI content generation not configured," never silently produce
// placeholder text disguised as a real suggestion.
export const nullAIProvider: AIContentPort = {
  isConfigured(): Promise<boolean> {
    return Promise.resolve(false);
  },

  generateContentPackage(_request: AIContentRequest): Promise<AIContentPackage> {
    return Promise.reject(new Error('AI content generation is not configured. Set an AI provider and API key to enable it.'));
  },

  generateImageTags(_imageUrl: string): Promise<readonly string[]> {
    return Promise.reject(new Error('AI image tagging is not configured. Set an AI provider and API key to enable it.'));
  },

  suggestImages(_request: AIContentRequest, _candidates: readonly AIImageCandidate[]): Promise<readonly AIImageSuggestion[]> {
    return Promise.reject(new Error('AI image suggestions are not configured. Set an AI provider and API key to enable it.'));
  },
};
