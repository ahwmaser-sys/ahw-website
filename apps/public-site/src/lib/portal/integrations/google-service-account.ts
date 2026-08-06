import { createSign } from 'crypto';

// Shared by every Google API integration that authenticates with a
// service account (GA4 Data API, Search Console) rather than end-user
// OAuth (Google Business Profile uses that path instead, via a normal
// OAuth consent screen) — one JWT-bearer token exchange implementation,
// not one per integration. Real RS256 signing against the service
// account's own private key, no Google SDK dependency needed for
// something this contained.
export interface GoogleServiceAccountKey {
  client_email: string;
  private_key: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function getGoogleAccessToken(key: GoogleServiceAccountKey, scopes: readonly string[]): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: scopes.join(' '),
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );
  const signingInput = `${header}.${claims}`;
  const signature = createSign('RSA-SHA256').update(signingInput).sign(key.private_key);
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google service-account token exchange failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error('Google service-account token exchange returned no access_token.');
  }
  return body.access_token;
}
