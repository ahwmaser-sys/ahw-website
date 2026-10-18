import { describe, it, expect } from 'vitest';
import { contactFormSchema } from './contactSchema';

const MINIMUM = {
  officeId: 'egypt',
  fullName: 'Mahmoud Al Wardany',
  email: 'm@example.com',
  phone: '+20 100 000 0000',
  message: 'I would like to discuss a villa in New Cairo.',
};

describe('contactFormSchema', () => {
  it('accepts an enquiry with only the four fields needed to reply', () => {
    // The point of the change: someone can make first contact without
    // answering qualification questions first.
    expect(contactFormSchema.safeParse(MINIMUM).success).toBe(true);
  });

  it('still accepts the full form', () => {
    const full = {
      ...MINIMUM,
      company: 'AHW',
      country: 'Egypt',
      projectType: 'Residential',
      budget: '100k-250k',
      timeline: '3-6 months',
    };
    expect(contactFormSchema.safeParse(full).success).toBe(true);
  });

  it('still demands the four, so an enquiry can always be answered', () => {
    for (const missing of ['fullName', 'email', 'phone', 'message'] as const) {
      const body: Record<string, unknown> = { ...MINIMUM };
      delete body[missing];
      expect(contactFormSchema.safeParse(body).success, missing).toBe(false);
    }
  });

  it('still rejects a bad email and the spam honeypot', () => {
    expect(contactFormSchema.safeParse({ ...MINIMUM, email: 'nope' }).success).toBe(false);
    expect(contactFormSchema.safeParse({ ...MINIMUM, honeypot: 'bot' }).success).toBe(false);
  });
});
