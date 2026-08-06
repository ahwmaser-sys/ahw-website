'use client';

import { useActionState } from 'react';
import styles from './portal-ui.module.css';

export type ActionState = { error?: string; success?: string };

interface ActionFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string | undefined;
  buttonClassName?: string | undefined;
}

// One generic form wrapper reused by every admin/client mutation
// (create/edit/disable/upload/etc) instead of hand-rolling
// useActionState + pending/error wiring per form. Actions that
// navigate away call redirect() server-side (never returns here);
// actions that stay on the page return { error } or { success }.
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = 'Saving…',
  className,
  buttonClassName,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={className ?? styles.form}>
      {children}
      {state.error && <p className={styles.errorMessage} role="alert">{state.error}</p>}
      {state.success && <p className={styles.successMessage} role="status">{state.success}</p>}
      <button type="submit" className={buttonClassName ?? styles.button} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
