'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormData } from '../validation/contactSchema';
import { trackEvent } from '../../../lib/analytics';
import styles from './ContactForm.module.css';

interface ContactFormProps {
  officeId: string;
}

// The destination office is now controlled entirely by the office tabs
// in ContactSection (see the Office Parity Rule notes there) — this form
// just reflects that choice via a hidden field. No visible selector here
// anymore; a second, independent office picker inside the form would
// let the two get out of sync and reintroduce exactly the ambiguity the
// tabs were built to remove.
export function ContactForm({ officeId }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      officeId,
      projectType: '',
      timeline: '',
    },
  });

  useEffect(() => {
    setValue('officeId', officeId);
  }, [officeId, setValue]);

  const selectedOfficeId = watch('officeId');

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      // GA4's own documented recommended event for a completed lead form —
      // no PII (name/email/phone/message), only the categorical fields a
      // business would actually segment leads by.
      trackEvent('generate_lead', {
        office_id: data.officeId,
        project_type: data.projectType,
        ...(data.timeline ? { timeline: data.timeline } : {}),
      });

      setSubmitStatus('success');
      reset();
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBudgetOptions = (officeId: string) => {
    if (officeId === 'egypt') {
      return [
        "Under 5M EGP",
        "5M - 20M EGP",
        "20M - 50M EGP",
        "50M+ EGP",
        "Other / Not Sure",
      ];
    } else if (officeId === 'kuwait') {
      return [
        "Under 50,000 KWD",
        "50,000 - 200,000 KWD",
        "200,000 - 500,000 KWD",
        "500,000+ KWD",
        "Other / Not Sure",
      ];
    }
    return [
      "Small Scale",
      "Medium Scale",
      "Large Scale",
      "Other / Not Sure"
    ];
  };

  const budgetOptions = getBudgetOptions(selectedOfficeId);

  if (submitStatus === 'success') {
    return (
      <div className={styles.successState}>
        <h3 className={styles.successTitle}>Thank You</h3>
        <p className={styles.successMessage}>
          Your inquiry has been received. Our team will review your details and contact you shortly.
        </p>
        <button onClick={() => setSubmitStatus('idle')} className={styles.submitButton}>
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <input type="text" {...register('honeypot')} className={styles.honeypot} tabIndex={-1} autoComplete="off" />
      <input type="hidden" {...register('officeId')} />

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="fullName" className={styles.label}>Full Name *</label>
          <input
            id="fullName"
            type="text"
            className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
            placeholder="John Doe"
            {...register('fullName')}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && <span id="fullName-error" role="alert" className={styles.errorText}>{errors.fullName.message}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="company" className={styles.label}>Company</label>
          <input
            id="company"
            type="text"
            className={styles.input}
            placeholder="AHW Architects"
            {...register('company')}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>Email Address *</label>
          <input
            id="email"
            type="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            placeholder="john@example.com"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <span id="email-error" role="alert" className={styles.errorText}>{errors.email.message}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="phone" className={styles.label}>Phone Number *</label>
          <input
            id="phone"
            type="tel"
            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            placeholder="+965 0000 0000"
            {...register('phone')}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && <span id="phone-error" role="alert" className={styles.errorText}>{errors.phone.message}</span>}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="country" className={styles.label}>Country *</label>
          <input
            id="country"
            type="text"
            className={`${styles.input} ${errors.country ? styles.inputError : ''}`}
            placeholder="Kuwait"
            {...register('country')}
            aria-invalid={!!errors.country}
            aria-describedby={errors.country ? 'country-error' : undefined}
          />
          {errors.country && <span id="country-error" role="alert" className={styles.errorText}>{errors.country.message}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="projectType" className={styles.label}>Project Type *</label>
          <select
            id="projectType"
            className={`${styles.select} ${errors.projectType ? styles.inputError : ''}`}
            {...register('projectType')}
            aria-invalid={!!errors.projectType}
            aria-describedby={errors.projectType ? 'projectType-error' : undefined}
          >
            <option value="" disabled>Select Type</option>
            <option value="Architecture">Architecture</option>
            <option value="Interior Design">Interior Design</option>
            <option value="Design & Build">Design & Build</option>
            <option value="Commercial">Commercial</option>
            <option value="Residential">Residential</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Retail">Retail</option>
            <option value="Office">Office</option>
            <option value="Other">Other</option>
          </select>
          {errors.projectType && <span id="projectType-error" role="alert" className={styles.errorText}>{errors.projectType.message}</span>}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="budget" className={styles.label}>Estimated Budget</label>
          <select
            id="budget"
            className={styles.select}
            {...register('budget')}
          >
            <option value="">Select Budget (Optional)</option>
            {budgetOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="timeline" className={styles.label}>Timeline *</label>
          <select
            id="timeline"
            className={`${styles.select} ${errors.timeline ? styles.inputError : ''}`}
            {...register('timeline')}
            aria-invalid={!!errors.timeline}
            aria-describedby={errors.timeline ? 'timeline-error' : undefined}
          >
            <option value="" disabled>Select Timeline</option>
            <option value="Immediate">Immediate</option>
            <option value="1-3 Months">1–3 Months</option>
            <option value="3-6 Months">3–6 Months</option>
            <option value="6+ Months">6+ Months</option>
          </select>
          {errors.timeline && <span id="timeline-error" role="alert" className={styles.errorText}>{errors.timeline.message}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="message" className={styles.label}>Message *</label>
        <textarea
          id="message"
          rows={5}
          className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
          placeholder="Tell us about your project..."
          {...register('message')}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && <span id="message-error" role="alert" className={styles.errorText}>{errors.message.message}</span>}
      </div>

      {submitStatus === 'error' && (
        <div className={styles.errorMessage} role="alert">
          An error occurred while sending your message. Please try again or contact us directly via email.
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
