import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Every Integration credential (social access tokens, AI API keys, GA4/GSC
// service-account JSON, email API key) is encrypted at rest with this one
// key — AES-256-GCM, authenticated so tampering is detected, not just
// unreadable. INTEGRATION_ENCRYPTION_KEY is the one genuinely
// infrastructure-level secret this subsystem needs (same category as
// SESSION_SECRET): generated once at deploy time, never entered through
// the UI, never rotated by the owner day-to-day.
//
// Derived lazily inside each function, not at module scope — Next.js
// imports route modules during `next build`'s page-data-collection pass,
// and a module-level throw over a missing env var fails the whole build
// the instant this file is imported (even transitively, by routes that
// never actually call encrypt/decrypt), over a key only actually needed
// once a credential is really being stored or read. Same reasoning
// already applied to the Resend client in the Contact/Careers routes.
function getKey(): Buffer {
  const KEY_B64 = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!KEY_B64) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be set to store integration credentials.');
  }
  const KEY = Buffer.from(KEY_B64, 'base64');
  if (KEY.length !== 32) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must decode to exactly 32 bytes (base64 of a 256-bit key).');
  }
  return KEY;
}

// iv:authTag:ciphertext, each base64 — self-contained so the ciphertext
// column alone (no side-channel state) is enough to decrypt.
export function encryptCredential(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptCredential(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed credential ciphertext.');
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64 as string, 'base64');
  const authTag = Buffer.from(authTagB64 as string, 'base64');
  const ciphertext = Buffer.from(ciphertextB64 as string, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function encryptJson(value: unknown): string {
  return encryptCredential(JSON.stringify(value));
}

export function decryptJson<T>(stored: string): T {
  return JSON.parse(decryptCredential(stored)) as T;
}
