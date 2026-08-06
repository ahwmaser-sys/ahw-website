import { getActiveBrandKit } from '../brand-kit';

// Shared by every provider adapter's generateContentPackage — kept out of
// the AIContentPort interface itself (packages/application stays free of
// this app's Brand Kit concept) so each adapter privately enriches its
// own prompt instead of the abstract port knowing about it.
export async function getBrandContext(): Promise<{ brandVoice: string | null; defaultHashtags: readonly string[] }> {
  const kit = await getActiveBrandKit();
  return { brandVoice: kit.brandVoice, defaultHashtags: kit.defaultHashtags };
}
