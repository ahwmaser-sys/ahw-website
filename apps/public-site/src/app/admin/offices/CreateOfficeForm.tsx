'use client';

import { createOffice } from '../../../lib/portal/actions/offices';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreateOfficeForm() {
  return (
    <ActionForm action={createOffice} submitLabel="Create office">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="displayName">Public display name</label>
          <input className={styles.input} id="displayName" name="displayName" placeholder="e.g. Egypt Office" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Internal name</label>
          <input className={styles.input} id="name" name="name" placeholder="e.g. Egypt HQ (back-office only)" required />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="slug">Slug</label>
          <input className={styles.input} id="slug" name="slug" placeholder="egypt (auto-generated if left blank)" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="country">Country</label>
          <input className={styles.input} id="country" name="country" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="city">City</label>
          <input className={styles.input} id="city" name="city" required />
        </div>
      </div>

      <div className={styles.checkboxRow}>
        <input type="checkbox" id="isHeadquarters" name="isHeadquarters" />
        <label htmlFor="isHeadquarters">This is the headquarters office</label>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="addressFull">Full address</label>
        <textarea className={styles.textarea} id="addressFull" name="addressFull" required />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="mapLink">Google Maps link</label>
          <input className={styles.input} id="mapLink" name="mapLink" placeholder="https://maps.app.goo.gl/..." />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="mapEmbedUrl">Google Maps embed URL</label>
          <input className={styles.input} id="mapEmbedUrl" name="mapEmbedUrl" placeholder="https://www.google.com/maps/embed?pb=..." />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phones">Phones (one per line)</label>
          <textarea className={styles.textarea} id="phones" name="phones" required placeholder={'+20 ...\n+20 ...'} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="emails">Emails (one per line, first is primary)</label>
          <textarea className={styles.textarea} id="emails" name="emails" required placeholder={'office@ahwarchitects.com'} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="website">Office website (optional)</label>
          <input className={styles.input} id="website" name="website" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="workingHours">Working hours</label>
          <input className={styles.input} id="workingHours" name="workingHours" placeholder="Sun–Thu, 9am–6pm" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="timezone">Timezone</label>
          <input className={styles.input} id="timezone" name="timezone" placeholder="Africa/Cairo" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="defaultLanguage">Default language</label>
          <select className={styles.select} id="defaultLanguage" name="defaultLanguage" defaultValue="en">
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="googleBusinessProfileUrl">Google Business Profile URL</label>
          <input className={styles.input} id="googleBusinessProfileUrl" name="googleBusinessProfileUrl" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ctaLabel">CTA label</label>
          <input className={styles.input} id="ctaLabel" name="ctaLabel" placeholder="Book a consultation" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ctaUrl">CTA URL</label>
          <input className={styles.input} id="ctaUrl" name="ctaUrl" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="instagramUrl">Instagram URL</label>
          <input className={styles.input} id="instagramUrl" name="instagramUrl" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="facebookUrl">Facebook URL</label>
          <input className={styles.input} id="facebookUrl" name="facebookUrl" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="linkedinUrl">LinkedIn URL</label>
          <input className={styles.input} id="linkedinUrl" name="linkedinUrl" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="whatsapp">WhatsApp number</label>
          <input className={styles.input} id="whatsapp" name="whatsapp" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="bookingUrl">Booking URL</label>
          <input className={styles.input} id="bookingUrl" name="bookingUrl" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="logoOverrideId">Logo override (Media Asset ID, optional)</label>
          <input className={styles.input} id="logoOverrideId" name="logoOverrideId" placeholder="Leave blank to inherit the Global Brand Kit logo" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qrCodeAssetId">QR code asset ID (optional)</label>
          <input className={styles.input} id="qrCodeAssetId" name="qrCodeAssetId" placeholder="Pin a saved Media Library asset, or leave blank to generate on demand" />
        </div>
      </div>
    </ActionForm>
  );
}
