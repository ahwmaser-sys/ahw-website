// Shared by every AIContentPort adapter — each provider is asked to
// respond with ONLY a JSON object/array, but none of their SDKs
// guarantee that literally (stray prose, code fences), so every adapter
// parses its response the same defensive way rather than four
// slightly-different copies of the same regex.
export function extractJson<T>(text: string): T {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const match = /[[{][\s\S]*[\]}]/.exec(candidate ?? text);
  if (!match) {
    throw new Error('AI response did not contain valid JSON.');
  }
  return JSON.parse(match[0]) as T;
}
