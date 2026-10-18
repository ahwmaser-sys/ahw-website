import { z } from 'zod';

// WHAT IS REQUIRED, AND WHY IT IS ONLY FOUR THINGS
// This form asked for seven mandatory answers before a stranger could say
// hello. Each one is another reason to close the tab, and an enquiry that is
// never sent cannot be qualified at all.
//
// Required is now the minimum needed to answer someone: who they are, two
// ways to reach them, and what they want. Phone stays mandatory deliberately
// -- in Egypt and Kuwait the reply usually happens by phone or WhatsApp, not
// email, so it is not padding here even though it would be on a US form.
//
// Country, project type and timeline became optional. They are qualification
// data, useful to have and never needed to start a conversation: the country
// is evident from the phone's own dialling code and from the office the
// visitor already picked, and the other two are exactly what the first reply
// asks about anyway.
//
// This schema is the single source of truth -- the browser validates with it
// via zodResolver and /api/contact re-validates with it server-side -- so the
// labels in ContactForm.tsx have to stay in step by hand. A field marked `*`
// there while optional here is a lie to the visitor, not a harmless mismatch.
export const contactFormSchema = z.object({
  officeId: z.string().min(1, 'Please select an office.'),
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  company: z.string().optional(),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(5, 'Please enter a valid phone number.'),
  country: z.string().optional(),
  projectType: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
  // Honeypot field for spam prevention - should be hidden from real users
  honeypot: z.string().max(0, 'Spam detected').optional(),
  // First-touch marketing attribution, read from sessionStorage by
  // AttributionCapture/attribution.ts — absent for a direct/organic
  // visit, never required.
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  ttclid: z.string().optional(),
  referrer: z.string().optional(),
  landingPath: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
