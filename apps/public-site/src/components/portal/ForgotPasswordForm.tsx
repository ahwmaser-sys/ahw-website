'use client';

import { useState } from 'react';
import styles from './LoginForm.module.css';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await fetch('/api/portal/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data: { message?: string } = await res.json().catch(() => ({}));
    setMessage(data.message ?? 'If an account exists for that email, a reset link has been sent.');
    setIsSubmitting(false);
  }

  if (message) {
    return <p className={styles.forgotLink}>{message}</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>Email Address</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? 'Sending…' : 'Send Reset Link'}
      </button>
    </form>
  );
}
