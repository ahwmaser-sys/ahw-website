import argon2 from 'argon2';

// argon2id — the brief's first-listed preference and the current OWASP
// default for new systems. Cost parameters left at argon2's own current
// defaults (m=65536 KiB, t=3, p=4), which already meet OWASP's minimum
// recommendation; not hand-tuned further without a real production
// host's memory budget to tune against.
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // A malformed/foreign hash format throws rather than returning false —
    // treat that the same as "wrong password" rather than letting it
    // bubble up as a 500 that could leak information about the stored hash.
    return false;
  }
}
