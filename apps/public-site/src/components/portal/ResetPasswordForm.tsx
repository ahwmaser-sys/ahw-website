'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginForm.module.css';

export function ResetPasswordForm({ token, loginHref }: { token: string; loginHref: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await fetch('/api/portal/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data: { error?: string } = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      setIsSubmitting(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push(loginHref), 2000);
  }

  if (done) {
    return <p className={styles.forgotLink}>Password updated. Redirecting to sign in…</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>New Password</label>
        <input
          id="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <div className={styles.errorMessage} role="alert">{error}</div>}
      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? 'Saving…' : 'Set New Password'}
      </button>
    </form>
  );
}
