import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { careersServerSchema } from '../../../features/careers/validation/careersSchema';
import { CareersNotificationEmail } from '../../../features/careers/emails/CareersNotification';
import { CareersConfirmationEmail } from '../../../features/careers/emails/CareersConfirmation';
import { isRateLimited } from '../../../lib/portal/rate-limit';
import { getClientIp } from '../../../lib/portal/audit';
import { getEmailSettings, resolveSenderIdentity } from '../../../lib/portal/email-settings';
import { getSiteUrl } from '../../../lib/site-config';

// Real backend for the Careers application form — previously this route
// didn't exist at all, and the form's onSubmit just console.logged the
// data (including the uploaded CV) and discarded it while telling the
// applicant "Application Submitted." Mirrors the Contact form's Resend-
// based pipeline (same pattern already proven in production for leads),
// with the CV attached to the internal notification rather than stored
// separately — there's no ATS/applicant-tracking model in this schema,
// and building one would be new product scope; email is the same
// destination a small firm's HR inbox already works from today.
//
// The Resend client is constructed lazily inside the handler, not at
// module scope — Next.js imports route modules during `next build`'s
// page-data-collection pass, and a module-level `new Resend(undefined)`
// throws "Missing API key" the instant RESEND_API_KEY isn't present in
// the build environment, failing the whole build over a key that's only
// actually needed at request time. Same reasoning already applied in
// lib/portal/email.ts's sendEmail().
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the client-side check
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const ip = getClientIp(request) ?? 'unknown';
    if (await isRateLimited(`careers:${ip}`, 5, 1000 * 60 * 15)) {
      return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    const formData = await request.formData();

    const fields = Object.fromEntries(
      ['fullName', 'email', 'phone', 'country', 'city', 'position', 'department', 'preferredOffice', 'experience', 'currentEmployer', 'portfolioUrl', 'linkedinUrl', 'coverLetter', 'honeypot'].map((key) => {
        const value = formData.get(key);
        return [key, typeof value === 'string' ? value : ''];
      })
    );

    const parsed = careersServerSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid form data', details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    if (data.honeypot) {
      return NextResponse.json({ success: true, note: 'Spam trapped' });
    }

    const cvFile = formData.get('cvFile');
    if (!(cvFile instanceof File)) {
      return NextResponse.json({ error: 'CV file is required.' }, { status: 400 });
    }
    if (cvFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'CV file must be under 5MB.' }, { status: 400 });
    }
    if (!ACCEPTED_FILE_TYPES.includes(cvFile.type)) {
      return NextResponse.json({ error: 'Only .pdf, .doc, and .docx files are accepted.' }, { status: 400 });
    }

    const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
    // Settings → Email — never an env var. Falls through Careers Email →
    // HR Email → the global Primary Contact Email, so this works
    // correctly even before the owner has set the two dedicated fields
    // (production default: Primary = mwardany@ahwarchitects.com,
    // Secondary, cc'd below = m.elwardany@gmail.com).
    const [emailSettings, siteUrl] = await Promise.all([getEmailSettings(), getSiteUrl()]);
    const careersEmail = emailSettings.careersEmail || emailSettings.hrEmail || emailSettings.primaryContactEmail;
    const sender = resolveSenderIdentity('careers', emailSettings);

    const notificationHtml = await render(
      CareersNotificationEmail({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        country: data.country,
        city: data.city,
        position: data.position,
        department: data.department,
        preferredOffice: data.preferredOffice,
        experience: data.experience,
        ...(data.currentEmployer ? { currentEmployer: data.currentEmployer } : {}),
        ...(data.portfolioUrl ? { portfolioUrl: data.portfolioUrl } : {}),
        ...(data.linkedinUrl ? { linkedinUrl: data.linkedinUrl } : {}),
        ...(data.coverLetter ? { coverLetter: data.coverLetter } : {}),
        cvFileName: cvFile.name,
      })
    );

    const notificationResult = await resend.emails.send({
      from: sender.from,
      to: careersEmail,
      ...(emailSettings.secondaryContactEmail ? { cc: emailSettings.secondaryContactEmail } : {}),
      ...(sender.replyTo ? { replyTo: sender.replyTo } : {}),
      subject: `New Application: ${data.position} — ${data.fullName}`,
      html: notificationHtml,
      attachments: [{ filename: cvFile.name, content: cvBuffer }],
    });

    if (notificationResult.error) {
      console.error('Resend careers notification failed:', notificationResult.error);
      return NextResponse.json({ error: 'Failed to submit application. Please try again or email us directly.' }, { status: 502 });
    }

    const confirmationHtml = await render(CareersConfirmationEmail({ name: data.fullName, position: data.position, siteUrl }));
    const confirmationResult = await resend.emails.send({
      from: sender.from,
      to: data.email,
      ...(sender.replyTo ? { replyTo: sender.replyTo } : {}),
      subject: 'We have received your application - AHW Architects',
      html: confirmationHtml,
    });
    if (confirmationResult.error) {
      // Same resilience rule as the contact route: HR already got the
      // application, a failed applicant-facing copy doesn't fail the request.
      console.error('Resend careers confirmation failed:', confirmationResult.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Careers API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
