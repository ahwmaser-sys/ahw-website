'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import styles from './CareersForm.module.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const careersSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(2, 'City is required'),
  position: z.string().min(2, 'Position is required'),
  department: z.string().min(2, 'Department is required'),
  preferredOffice: z.enum(['Egypt', 'Kuwait', 'Future Offices']),
  experience: z.string().min(1, 'Years of experience is required'),
  currentEmployer: z.string().optional(),
  portfolioUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  coverLetter: z.string().min(50, 'Cover letter should be at least 50 characters').optional().or(z.literal('')),
  cvFile: z
    .any()
    .refine((files) => files?.length == 1, 'CV is required')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, 'Max file size is 5MB')
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      'Only .pdf, .doc, and .docx files are accepted'
    ),
  honeypot: z.string().max(0) // Anti-spam
});

type CareersFormData = z.infer<typeof careersSchema>;

export function CareersForm() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CareersFormData>({
    resolver: zodResolver(careersSchema),
    defaultValues: {
      honeypot: '',
      preferredOffice: 'Egypt'
    }
  });

  const onSubmit = async (data: CareersFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('country', data.country);
      formData.append('city', data.city);
      formData.append('position', data.position);
      formData.append('department', data.department);
      formData.append('preferredOffice', data.preferredOffice);
      formData.append('experience', data.experience);
      if (data.currentEmployer) formData.append('currentEmployer', data.currentEmployer);
      if (data.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);
      if (data.linkedinUrl) formData.append('linkedinUrl', data.linkedinUrl);
      if (data.coverLetter) formData.append('coverLetter', data.coverLetter);
      formData.append('honeypot', data.honeypot ?? '');
      formData.append('cvFile', data.cvFile[0]);

      const response = await fetch('/api/careers', { method: 'POST', body: formData });
      if (!response.ok) {
        throw new Error('Application submission failed');
      }

      setSubmitStatus('success');
      reset();
    } catch (error) {
      console.error('Submission failed', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formWrapper}>
      {submitStatus === 'success' ? (
        <div className={styles.successMessage}>
          <h3>Application Submitted</h3>
          <p>Thank you for your interest in joining AHW Architects. Our HR team will review your application and contact you if there is a suitable match.</p>
          <button onClick={() => setSubmitStatus('idle')} className={styles.submitButton}>
            Submit Another Application
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <input type="text" {...register('honeypot')} style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Full Name *</label>
              <input id="fullName" type="text" {...register('fullName')} className={errors.fullName ? styles.inputError : ''} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'fullName-error' : undefined} />
              {errors.fullName && <span id="fullName-error" role="alert" className={styles.errorMessage}>{errors.fullName.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address *</label>
              <input id="email" type="email" {...register('email')} className={errors.email ? styles.inputError : ''} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
              {errors.email && <span id="email-error" role="alert" className={styles.errorMessage}>{errors.email.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number *</label>
              <input id="phone" type="tel" {...register('phone')} className={errors.phone ? styles.inputError : ''} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} />
              {errors.phone && <span id="phone-error" role="alert" className={styles.errorMessage}>{errors.phone.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="country">Country *</label>
              <input id="country" type="text" {...register('country')} className={errors.country ? styles.inputError : ''} aria-invalid={!!errors.country} aria-describedby={errors.country ? 'country-error' : undefined} />
              {errors.country && <span id="country-error" role="alert" className={styles.errorMessage}>{errors.country.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="city">City *</label>
              <input id="city" type="text" {...register('city')} className={errors.city ? styles.inputError : ''} aria-invalid={!!errors.city} aria-describedby={errors.city ? 'city-error' : undefined} />
              {errors.city && <span id="city-error" role="alert" className={styles.errorMessage}>{errors.city.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="preferredOffice">Preferred Office *</label>
              <select id="preferredOffice" {...register('preferredOffice')} className={errors.preferredOffice ? styles.inputError : ''} aria-invalid={!!errors.preferredOffice} aria-describedby={errors.preferredOffice ? 'preferredOffice-error' : undefined}>
                <option value="Egypt">Egypt</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Future Offices">Future Offices</option>
              </select>
              {errors.preferredOffice && <span id="preferredOffice-error" role="alert" className={styles.errorMessage}>{errors.preferredOffice.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="position">Position Applying For *</label>
              <input id="position" type="text" {...register('position')} className={errors.position ? styles.inputError : ''} aria-invalid={!!errors.position} aria-describedby={errors.position ? 'position-error' : undefined} />
              {errors.position && <span id="position-error" role="alert" className={styles.errorMessage}>{errors.position.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="department">Department *</label>
              <select id="department" {...register('department')} className={errors.department ? styles.inputError : ''} aria-invalid={!!errors.department} aria-describedby={errors.department ? 'department-error' : undefined}>
                <option value="">Select Department...</option>
                <option value="Architecture">Architecture</option>
                <option value="Interior Design">Interior Design</option>
                <option value="Engineering">Engineering</option>
                <option value="Construction & Execution">Construction & Execution</option>
                <option value="Project Management">Project Management</option>
                <option value="Administration">Administration & HR</option>
              </select>
              {errors.department && <span id="department-error" role="alert" className={styles.errorMessage}>{errors.department.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="experience">Years of Experience *</label>
              <input id="experience" type="text" placeholder="e.g. 5 Years" {...register('experience')} className={errors.experience ? styles.inputError : ''} aria-invalid={!!errors.experience} aria-describedby={errors.experience ? 'experience-error' : undefined} />
              {errors.experience && <span id="experience-error" role="alert" className={styles.errorMessage}>{errors.experience.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="currentEmployer">Current Employer (Optional)</label>
              <input id="currentEmployer" type="text" {...register('currentEmployer')} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="portfolioUrl">Portfolio URL (Optional)</label>
              <input id="portfolioUrl" type="url" placeholder="https://" {...register('portfolioUrl')} className={errors.portfolioUrl ? styles.inputError : ''} aria-invalid={!!errors.portfolioUrl} aria-describedby={errors.portfolioUrl ? 'portfolioUrl-error' : undefined} />
              {errors.portfolioUrl && <span id="portfolioUrl-error" role="alert" className={styles.errorMessage}>{errors.portfolioUrl.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="linkedinUrl">LinkedIn URL (Optional)</label>
              <input id="linkedinUrl" type="url" placeholder="https://" {...register('linkedinUrl')} className={errors.linkedinUrl ? styles.inputError : ''} aria-invalid={!!errors.linkedinUrl} aria-describedby={errors.linkedinUrl ? 'linkedinUrl-error' : undefined} />
              {errors.linkedinUrl && <span id="linkedinUrl-error" role="alert" className={styles.errorMessage}>{errors.linkedinUrl.message}</span>}
            </div>
          </div>

          <div className={styles.formGroupFull}>
            <label htmlFor="cvFile">Upload CV (PDF, DOC, DOCX - Max 5MB) *</label>
            <input id="cvFile" type="file" accept=".pdf,.doc,.docx" {...register('cvFile')} className={styles.fileInput} aria-invalid={!!errors.cvFile} aria-describedby={errors.cvFile ? 'cvFile-error' : undefined} />
            {errors.cvFile && <span id="cvFile-error" role="alert" className={styles.errorMessage}>{errors.cvFile.message?.toString()}</span>}
          </div>

          <div className={styles.formGroupFull}>
            <label htmlFor="coverLetter">Cover Letter / Message (Optional)</label>
            <textarea id="coverLetter" rows={5} {...register('coverLetter')} className={errors.coverLetter ? styles.inputError : ''} aria-invalid={!!errors.coverLetter} aria-describedby={errors.coverLetter ? 'coverLetter-error' : undefined}></textarea>
            {errors.coverLetter && <span id="coverLetter-error" role="alert" className={styles.errorMessage}>{errors.coverLetter.message}</span>}
          </div>

          {submitStatus === 'error' && (
            <div className={styles.formError} role="alert">
              There was a problem submitting your application. Please try again.
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>
      )}
    </div>
  );
}
