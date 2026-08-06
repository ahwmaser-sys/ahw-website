'use client';

import { updateAISettings } from '../../../../lib/portal/actions/integrations';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

const OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'None (AI Marketing Assistant shows "not configured")' },
  { value: 'AI_ANTHROPIC', label: 'Anthropic' },
  { value: 'AI_OPENAI', label: 'OpenAI' },
  { value: 'AI_GEMINI', label: 'Google Gemini' },
  { value: 'AI_OPENROUTER', label: 'OpenRouter' },
];

export function DefaultProviderForm({ defaultProvider, defaultModel }: { defaultProvider: string | null; defaultModel: string | null }) {
  return (
    <ActionForm action={updateAISettings} submitLabel="Save default">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="defaultProvider">Default provider</label>
          <select className={styles.select} id="defaultProvider" name="defaultProvider" defaultValue={defaultProvider ?? ''}>
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="defaultModel">Default model override (optional)</label>
          <input className={styles.input} id="defaultModel" name="defaultModel" defaultValue={defaultModel ?? ''} placeholder="Leave blank to use the connected model" />
        </div>
      </div>
    </ActionForm>
  );
}
