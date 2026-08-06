import { z } from 'zod';

export const contactFormSchema = z.object({
  officeId: z.string().min(1, 'Please select an office.'),
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  company: z.string().optional(),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(5, 'Please enter a valid phone number.'),
  country: z.string().min(2, 'Please specify your country.'),
  projectType: z.string().min(1, 'Please select a project type.'),
  budget: z.string().optional(),
  timeline: z.string().min(1, 'Please select a timeline.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
  // Honeypot field for spam prevention - should be hidden from real users
  honeypot: z.string().max(0, 'Spam detected').optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
