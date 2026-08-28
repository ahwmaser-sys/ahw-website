'use client';

import { updateOffice, archiveOffice, restoreOffice, deleteOffice, updateOfficeLegalInfo } from '../../../../lib/portal/actions/offices';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';
import type { Office } from '@prisma/client';

export function UpdateOfficeForm({ office }: { office: Office }) {
  const social = (office.socialLinks as Record<string, string> | null) ?? {};

  return (
    <ActionForm action={updateOffice} submitLabel="Save changes">
      <input type="hidden" name="officeId" value={office.id} />

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="displayName">Public display name</label>
          <input className={styles.input} id="displayName" name="displayName" defaultValue={office.displayName} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Internal name</label>
          <input className={styles.input} id="name" name="name" defaultValue={office.name} required />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="slug">Slug</label>
          <input className={styles.input} id="slug" name="slug" defaultValue={office.slug} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="country">Country</label>
          <input className={styles.input} id="country" name="country" defaultValue={office.country} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="city">City</label>
          <input className={styles.input} id="city" name="city" defaultValue={office.city} required />
        </div>
      </div>

      <div className={styles.checkboxRow}>
        <input type="checkbox" id="isHeadquarters" name="isHeadquarters" defaultChecked={office.isHeadquarters} />
        <label htmlFor="isHeadquarters">This is the headquarters office</label>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="addressFull">Full address</label>
        <textarea className={styles.textarea} id="addressFull" name="addressFull" defaultValue={office.addressFull} required />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="addressStreet">Street (structured)</label>
          <input className={styles.input} id="addressStreet" name="addressStreet" defaultValue={office.addressStreet ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="addressBuilding">Building / floor / office (structured)</label>
          <input className={styles.input} id="addressBuilding" name="addressBuilding" defaultValue={office.addressBuilding ?? ''} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="postalCode">Postal code</label>
        <input className={styles.input} id="postalCode" name="postalCode" defaultValue={office.postalCode ?? ''} placeholder="Verified against the office's Google Business Profile" />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="mapLink">Google Maps link</label>
          <input className={styles.input} id="mapLink" name="mapLink" defaultValue={office.mapLink ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="mapEmbedUrl">Google Maps embed URL</label>
          <input className={styles.input} id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={office.mapEmbedUrl ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phones">Phones (one per line)</label>
          <textarea className={styles.textarea} id="phones" name="phones" defaultValue={office.phones.join('\n')} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="emails">Emails (one per line, first is primary)</label>
          <textarea className={styles.textarea} id="emails" name="emails" defaultValue={office.emails.join('\n')} required />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="website">Office website (optional)</label>
          <input className={styles.input} id="website" name="website" defaultValue={office.website ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="workingHours">Working hours</label>
          <input className={styles.input} id="workingHours" name="workingHours" defaultValue={office.workingHours ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="timezone">Timezone</label>
          <input className={styles.input} id="timezone" name="timezone" defaultValue={office.timezone ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="defaultLanguage">Default language</label>
          <select className={styles.select} id="defaultLanguage" name="defaultLanguage" defaultValue={office.defaultLanguage}>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="googleBusinessProfileUrl">Google Business Profile URL</label>
          <input className={styles.input} id="googleBusinessProfileUrl" name="googleBusinessProfileUrl" defaultValue={office.googleBusinessProfileUrl ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ctaLabel">CTA label</label>
          <input className={styles.input} id="ctaLabel" name="ctaLabel" defaultValue={office.ctaLabel ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ctaUrl">CTA URL</label>
          <input className={styles.input} id="ctaUrl" name="ctaUrl" defaultValue={office.ctaUrl ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="instagramUrl">Instagram URL</label>
          <input className={styles.input} id="instagramUrl" name="instagramUrl" defaultValue={social.instagram ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="facebookUrl">Facebook URL</label>
          <input className={styles.input} id="facebookUrl" name="facebookUrl" defaultValue={social.facebook ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="linkedinUrl">LinkedIn URL</label>
          <input className={styles.input} id="linkedinUrl" name="linkedinUrl" defaultValue={social.linkedin ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="whatsapp">WhatsApp number</label>
          <input className={styles.input} id="whatsapp" name="whatsapp" defaultValue={social.whatsapp ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="bookingUrl">Booking URL</label>
          <input className={styles.input} id="bookingUrl" name="bookingUrl" defaultValue={social.bookingUrl ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="logoOverrideId">Logo override (Media Asset ID, optional)</label>
          <input className={styles.input} id="logoOverrideId" name="logoOverrideId" defaultValue={office.logoOverrideId ?? ''} placeholder="Leave blank to inherit the Global Brand Kit logo" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qrCodeAssetId">QR code asset ID (optional)</label>
          <input className={styles.input} id="qrCodeAssetId" name="qrCodeAssetId" defaultValue={office.qrCodeAssetId ?? ''} />
        </div>
      </div>
    </ActionForm>
  );
}

// Optional, backward-compatible — every field starts empty/false for any
// office created before this existed, and nothing here is required.
// Displayed publicly (Footer, per-office contact areas) only when
// "Display legal information publicly" is checked AND the specific field
// has a value — see toLegacyOfficeShape/buildLegalInfo in
// lib/portal/offices.ts, the one place that gate is enforced.
export function LegalInfoForm({ office }: { office: Office }) {
  return (
    <ActionForm action={updateOfficeLegalInfo} submitLabel="Save legal information">
      <input type="hidden" name="officeId" value={office.id} />

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="legalEntityName">Legal entity name</label>
          <input className={styles.input} id="legalEntityName" name="legalEntityName" defaultValue={office.legalEntityName ?? ''} placeholder="e.g. AHW Architects Masr for Engineering Consultancy" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="licenseNumber">License / registration number (optional)</label>
          <input className={styles.input} id="licenseNumber" name="licenseNumber" defaultValue={office.licenseNumber ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="commercialRegistrationNumber">Commercial registration number</label>
          <input className={styles.input} id="commercialRegistrationNumber" name="commercialRegistrationNumber" defaultValue={office.commercialRegistrationNumber ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="taxRegistrationNumber">Tax registration number</label>
          <input className={styles.input} id="taxRegistrationNumber" name="taxRegistrationNumber" defaultValue={office.taxRegistrationNumber ?? ''} />
        </div>
      </div>

      <div className={styles.checkboxRow}>
        <input type="checkbox" id="vatRegistered" name="vatRegistered" defaultChecked={office.vatRegistered} />
        <label htmlFor="vatRegistered">This entity is VAT registered</label>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="vatRegistrationNumber">VAT registration number</label>
        <input className={styles.input} id="vatRegistrationNumber" name="vatRegistrationNumber" defaultValue={office.vatRegistrationNumber ?? ''} placeholder="Only shown publicly if VAT registered is checked" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="otherRegistrationIdentifier">Other registration identifier (optional)</label>
        <input className={styles.input} id="otherRegistrationIdentifier" name="otherRegistrationIdentifier" defaultValue={office.otherRegistrationIdentifier ?? ''} placeholder="For an identifier type not covered above" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="regulatoryNotes">Regulatory notes (internal only, never displayed publicly)</label>
        <textarea className={styles.textarea} id="regulatoryNotes" name="regulatoryNotes" defaultValue={office.regulatoryNotes ?? ''} />
      </div>

      <div className={styles.checkboxRow}>
        <input type="checkbox" id="displayLegalInfo" name="displayLegalInfo" defaultChecked={office.displayLegalInfo} />
        <label htmlFor="displayLegalInfo">Display legal information publicly (Footer)</label>
      </div>
    </ActionForm>
  );
}

export function ArchiveOfficeForm({ officeId }: { officeId: string }) {
  return (
    <ActionForm action={archiveOffice} submitLabel="Archive office" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="officeId" value={officeId} />
    </ActionForm>
  );
}

export function RestoreOfficeForm({ officeId }: { officeId: string }) {
  return (
    <ActionForm action={restoreOffice} submitLabel="Restore office" className={styles.buttonRow}>
      <input type="hidden" name="officeId" value={officeId} />
    </ActionForm>
  );
}

export function DeleteOfficeForm({ officeId }: { officeId: string }) {
  return (
    <ActionForm action={deleteOffice} submitLabel="Delete permanently" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="officeId" value={officeId} />
    </ActionForm>
  );
}
