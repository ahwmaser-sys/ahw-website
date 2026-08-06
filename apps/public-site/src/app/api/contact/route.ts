import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { contactFormSchema } from '../../../features/contact/validation/contactSchema';
import { InternalNotificationEmail } from '../../../features/contact/emails/InternalNotification';
import { ClientConfirmationEmail } from '../../../features/contact/emails/ClientConfirmation';
import { prisma } from '../../../lib/portal/db';
import { getClientIp } from '../../../lib/portal/audit';
import { isRateLimited } from '../../../lib/portal/rate-limit';
import { getOfficeBySlug } from '../../../lib/portal/offices';
import { getEmailSettings, resolveSenderIdentity } from '../../../lib/portal/email-settings';
import { getSiteUrl } from '../../../lib/site-config';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 0. Rate limiting — this route had none despite being fully public
    // and (as of this pass) writing to the database; same sliding-window
    // limiter and per-IP key the login/forgot-password routes already
    // use, just a higher ceiling since real prospects submitting once is
    // the overwhelmingly common case.
    const ip = getClientIp(request) ?? 'unknown';
    if (await isRateLimited(`contact:${ip}`, 5, 1000 * 60 * 15)) {
      return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    const body: unknown = await request.json();

    // 1. Validation
    const parsedData = contactFormSchema.safeParse(body);
    
    if (!parsedData.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsedData.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsedData.data;

    // 2. Spam Protection (Honeypot)
    if (data.honeypot) {
      // If honeypot is filled, it's a bot. Silently drop the request but return success.
      return NextResponse.json({ success: true, note: 'Spam trapped' });
    }

    // 3. Request Metadata (for the Enquiry record and future CRM export)
    const ipAddress = getClientIp(request) ?? 'Unknown';
    const userAgent = request.headers.get('user-agent') ?? 'Unknown';

    // 4. Database Transaction — every enquiry gets a durable record
    // before anything else happens. This used to be commented out
    // waiting on "a production DATABASE_URL," but the Prisma connection
    // this whole app already runs on (Client Portal, Marketing Studio,
    // everything under /admin) is exactly that connection — leaving this
    // disabled meant every lead only ever existed as an email, with no
    // database record, no /admin visibility, and no recovery if the
    // email silently landed in spam. A DB failure here is logged but
    // never blocks the email notification below — the office still
    // gets the lead either way.
    try {
      await prisma.enquiry.create({
        data: {
          office: data.officeId,
          name: data.fullName,
          company: data.company || null,
          email: data.email,
          phone: data.phone,
          country: data.country,
          projectType: data.projectType,
          budget: data.budget || null,
          timeline: data.timeline,
          message: data.message,
          ipAddress,
          userAgent,
          status: 'New',
        },
      });
    } catch (error) {
      console.error('Failed to save enquiry to database (email will still be sent):', error);
    }

    // 5. Email Dispatch (Resend) — routed to the selected office's own
    // email (Settings → Offices), falling back to the global Primary
    // Contact Email (Settings → Email) if that office has none set or
    // the officeId didn't match a real office. Never a hardcoded
    // per-office switch statement or an env var.
    const [office, emailSettings, siteUrl] = await Promise.all([getOfficeBySlug(data.officeId), getEmailSettings(), getSiteUrl()]);
    const destinationEmail = office?.emails[0] || emailSettings.primaryContactEmail;
    const officeName = office?.name || 'AHW Architects';
    const sender = resolveSenderIdentity('contact', emailSettings);

    // Render Email Templates to HTML strings
    const internalHtml = await render(
      InternalNotificationEmail({
        name: data.fullName,
        ...(data.company ? { company: data.company } : {}),
        email: data.email,
        phone: data.phone,
        country: data.country,
        projectType: data.projectType,
        ...(data.budget ? { budget: data.budget } : {}),
        timeline: data.timeline,
        message: data.message,
        officeName,
      })
    );

    const clientConfirmationHtml = await render(
      ClientConfirmationEmail({
        name: data.fullName,
        officeName,
        siteUrl,
      })
    );

    // Send Internal Notification to the correct office, cc'd to the
    // Secondary Contact Email (Settings → Email) when one is set.
    const internalResult = await resend.emails.send({
      from: sender.from,
      to: destinationEmail,
      ...(emailSettings.secondaryContactEmail ? { cc: emailSettings.secondaryContactEmail } : {}),
      ...(sender.replyTo ? { replyTo: sender.replyTo } : {}),
      subject: `New Enquiry from ${data.fullName} - ${data.projectType}`,
      html: internalHtml,
    });

    if (internalResult.error) {
      console.error('Resend internal notification failed:', internalResult.error);
      return NextResponse.json(
        { error: 'Failed to send enquiry. Please try again or contact us directly.' },
        { status: 502 }
      );
    }

    // Send Auto-Confirmation to the Client
    const clientResult = await resend.emails.send({
      from: sender.from,
      to: data.email,
      ...(sender.replyTo ? { replyTo: sender.replyTo } : {}),
      subject: 'We have received your inquiry - AHW Architects',
      html: clientConfirmationHtml,
    });

    if (clientResult.error) {
      // Internal notification already succeeded — the office got the lead.
      // Don't fail the whole request just because the client's confirmation
      // copy didn't send; log it and still report success to the user.
      console.error('Resend client confirmation failed:', clientResult.error);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
