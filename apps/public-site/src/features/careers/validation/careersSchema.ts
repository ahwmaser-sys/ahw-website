import { z } from 'zod';

// Server-side counterpart to CareersForm.tsx's client schema — no file
// validation here (a FileList only exists in the browser); the API
// route checks the actual uploaded file's size/type itself.
export const careersServerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(8, 'Phone number is required.'),
  country: z.string().min(2, 'Country is required.'),
  city: z.string().min(2, 'City is required.'),
  position: z.string().min(2, 'Position is required.'),
  department: z.string().min(2, 'Department is required.'),
  preferredOffice: z.enum(['Egypt', 'Kuwait', 'Future Offices']),
  experience: z.string().min(1, 'Years of experience is required.'),
  currentEmployer: z.string().optional(),
  portfolioUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  // Honeypot — same anti-spam pattern as the contact form.
  honeypot: z.string().max(0).optional(),
});

export type CareersServerData = z.infer<typeof careersServerSchema>;
