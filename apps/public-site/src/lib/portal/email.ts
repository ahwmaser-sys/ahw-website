import { Resend } from 'resend';
import { getIntegrationCredential } from './integrations/store';
import { getActiveBrandKit } from './brand-kit';

// Same verified sending domain the public Contact/Careers routes already
// use (api/contact/route.ts, api/careers/route.ts) — not Resend's shared
// onboarding@resend.dev sandbox address, which portal emails (password
// resets, client welcome emails, staff invites) were incorrectly using.
// A sender domain requires real DNS verification in Resend, so — like
// those two routes — this stays a hardcoded infra constant rather than
// an admin-editable setting.
const FROM = 'AHW Architects Portal <noreply@contact.ahwspaces.com>';

// Shaped like packages/application's EmailPort — see /PORTAL-PLAN.md §1.
// Reuses the same `resend` package already a dependency for the contact
// form, not a second email library. The API key resolves from Settings →
// Integrations first (see the go-live report); RESEND_API_KEY stays as a
// fallback specifically because this app's *own* password-reset and
// email-verification flows depend on it, including before a SUPER_ADMIN
// has ever logged in to connect it from the UI — every other credential
// in this app can safely have no env fallback, this one can't.
async function getApiKey(): Promise<string | undefined> {
  const cred = await getIntegrationCredential<{ apiKey: string }>('SMTP_EMAIL');
  return cred?.apiKey ?? process.env.RESEND_API_KEY;
}

export async function sendEmail(message: { to: string; subject: string; bodyText: string }): Promise<void> {
  const apiKey = await getApiKey();
  const resend = new Resend(apiKey);
  const kit = await getActiveBrandKit();
  const body = kit.emailSignature ? `${message.bodyText}\n\n${kit.emailSignature}` : message.bodyText;

  const result = await resend.emails.send({
    from: FROM,
    to: message.to,
    subject: message.subject,
    text: body,
  });

  if (result.error) {
    // Never throw into a password-reset/verification flow — the
    // generic "check your email" response must be identical whether the
    // address exists or not (same principle as login's generic error),
    // and a delivery failure shouldn't surface as a 500 to the client.
    console.error('Portal email send failed:', result.error);
  }
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: 'Reset your AHW Architects portal password',
    bodyText: `A password reset was requested for your account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
  };
}

// Sent once, automatically, the moment an admin creates a Client account
// — never a plaintext password (same principle as inviteStaffUser's
// random-password-plus-reset-link pattern, just for the CLIENT role).
export function clientWelcomeEmail(companyName: string, setPasswordUrl: string) {
  return {
    subject: 'Welcome to your AHW Architects Client Portal',
    bodyText: `Hello,\n\nAn AHW Architects Client Portal account has been created for ${companyName}. Set your password to get started:\n\n${setPasswordUrl}\n\nThis link expires in 1 hour. Once your password is set, sign in any time from the Client Portal link in the site footer.`,
  };
}

export function emailVerificationEmail(verifyUrl: string) {
  return {
    subject: 'Verify your AHW Architects portal email',
    bodyText: `Welcome to the AHW Architects portal.\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  };
}
