import type { AIContentRequest, AIImageCandidate } from '@agp/application';

// One prompt per task, shared by every provider adapter — the prompt is
// part of what "no hardcoded prompts" means in practice: it lives here,
// in one place, independent of which vendor's SDK happens to be calling
// it, not copy-pasted with small drifts into four adapter files.
//
// brandContext comes from the Brand Kit (brandVoice + defaultHashtags,
// see lib/portal/actions/ai-content.ts's call site) — when the owner has
// filled those in, the model is told to write in that voice and prefer
// those hashtags; when they're empty, the prompt degrades gracefully to
// its previous generic instruction rather than injecting an empty
// "Brand voice: " line.
export function contentPackagePrompt(request: AIContentRequest, brandContext?: { brandVoice?: string | null; defaultHashtags?: readonly string[] }): string {
  const voiceLine = brandContext?.brandVoice ? `\n\nWrite in this brand voice: ${brandContext.brandVoice}` : '';
  const hashtagLine =
    brandContext?.defaultHashtags && brandContext.defaultHashtags.length > 0
      ? `\n\nWhen relevant, prefer including some of these standing hashtags alongside article-specific ones: ${brandContext.defaultHashtags.join(', ')}`
      : '';
  // Publishing Target awareness — "AI should automatically know which
  // office is publishing" (multi-office brief). Absent means Global: the
  // article speaks for the whole firm, not one office.
  const officeLine = request.officeContext
    ? `\n\nThis content is being published for the ${request.officeContext.displayName} office in ${request.officeContext.city}, ${request.officeContext.country}. Where natural, reflect that office's location; do not invent details about other offices.${request.officeContext.ctaLabel ? ` Prefer this office's own call-to-action where it fits: "${request.officeContext.ctaLabel}".` : ''}`
    : '\n\nThis content is being published globally, on behalf of the whole firm across all its offices — do not reference any single office by name.';
  const languageLine = request.language && request.language !== 'en' ? `\n\nWrite the entire output (every field) in this language: ${request.language}.` : '';
  return `You are a marketing copywriter for AHW Architects, a luxury architecture and interior design firm. Given this article, produce a JSON object with exactly these keys: seoTitle (max 60 chars), metaDescription (max 155 chars), altText (for the article's cover image), caption (for social media), hashtags (array of 5-8 strings, no # prefix), keywords (array of 5-8 SEO keywords), suggestedCta (short call-to-action phrase), marketingSummary (2-3 sentences summarizing the marketing angle). Respond with ONLY the JSON object, no other text.${voiceLine}${hashtagLine}${officeLine}${languageLine}\n\nTitle: ${request.title}\nExcerpt: ${request.excerpt}\nBody: ${request.body.slice(0, 3000)}`;
}

export const IMAGE_TAG_PROMPT =
  'List 5-10 descriptive keyword tags for this architecture/interior design photo, as a JSON array of strings only. No other text.';

export function imageSuggestionPrompt(request: AIContentRequest, candidates: readonly AIImageCandidate[]): string {
  const candidateList = candidates
    .map((c) => `- ${c.assetId}: keywords=[${c.keywords.join(', ')}]${c.altText ? `, alt="${c.altText}"` : ''}`)
    .join('\n');
  return `Given this article and a list of candidate images (by id, with their keywords/alt text), rank the most relevant images. Respond with ONLY a JSON array of objects: [{"assetId": string, "reason": string, "score": number 0-1}], most relevant first.\n\nArticle title: ${request.title}\nExcerpt: ${request.excerpt}\n\nCandidates:\n${candidateList}`;
}
