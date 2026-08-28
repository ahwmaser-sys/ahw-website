'use client';

import {
  createResidentialExperience,
  updateResidentialExperience,
  archiveResidentialExperience,
  restoreResidentialExperience,
  deleteResidentialExperience,
} from '../../../lib/portal/actions/residential-experience';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';
import type { ResidentialExperience } from '@prisma/client';

const CATEGORY_OPTIONS = [
  { value: 'CURRENT_AHW_PROJECT', label: 'Current AHW Project' },
  { value: 'PREVIOUS_AHW_EXPERIENCE', label: 'Previous AHW / Company Experience' },
  { value: 'TEAM_PROFESSIONAL_EXPERIENCE', label: 'Team / Professional Experience' },
  { value: 'COLLABORATIVE_INVOLVEMENT', label: 'Collaborative / Professional Involvement' },
  { value: 'TARGET_COMMUNITY', label: 'Target Community (never shown publicly)' },
] as const;

const STATUS_OPTIONS = [
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REVIEW_REQUIRED', label: 'Review Required' },
  { value: 'TARGET', label: 'Target (internal only)' },
] as const;

// Shared by both the "new" and "[id]" pages — a plain object default
// covers the create case, a real row covers edit. Every field mirrors
// updateResidentialExperience's schema in lib/portal/actions/
// residential-experience.ts exactly.
export function ResidentialExperienceForm({ entry }: { entry?: ResidentialExperience }) {
  const action = entry ? updateResidentialExperience : createResidentialExperience;

  return (
    <ActionForm action={action} submitLabel={entry ? 'Save changes' : 'Create entry'}>
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <h3 className={styles.sectionTitle}>Public Information</h3>
      <p className={styles.cardMeta}>Shown on the public /residential page only when Status = Verified and Public Display = On, below.</p>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Community name</label>
          <input className={styles.input} id="name" name="name" defaultValue={entry?.name ?? ''} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="region">Region</label>
          <input className={styles.input} id="region" name="region" defaultValue={entry?.region ?? ''} placeholder="e.g. New Cairo, West Cairo / 6th of October, North Coast" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="country">Country</label>
          <input className={styles.input} id="country" name="country" defaultValue={entry?.country ?? 'Egypt'} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="city">City</label>
          <input className={styles.input} id="city" name="city" defaultValue={entry?.city ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="projectType">Project type</label>
          <input className={styles.input} id="projectType" name="projectType" defaultValue={entry?.projectType ?? ''} placeholder="e.g. Chalet, Villa" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="developerName">Developer name</label>
          <input className={styles.input} id="developerName" name="developerName" defaultValue={entry?.developerName ?? ''} placeholder="Only shown publicly if verified, below" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="experiencePeriod">Experience period (optional)</label>
          <input className={styles.input} id="experiencePeriod" name="experiencePeriod" defaultValue={entry?.experiencePeriod ?? ''} />
        </div>
      </div>

      <div className={styles.checkboxRow}>
        <input type="checkbox" id="developerVerified" name="developerVerified" defaultChecked={entry?.developerVerified ?? false} />
        <label htmlFor="developerVerified">Developer name is independently verified — required before it can display publicly</label>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="scope">Scope (optional)</label>
        <input className={styles.input} id="scope" name="scope" defaultValue={entry?.scope ?? ''} placeholder="e.g. Client support and supervision" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="publicWording">Public wording</label>
        <textarea className={styles.textarea} id="publicWording" name="publicWording" defaultValue={entry?.publicWording ?? ''} required
          placeholder="Use the least aggressive wording that remains accurate — e.g. &quot;Professional experience&quot; or &quot;Professional involvement&quot;. Never &quot;AHW project&quot; or &quot;delivered by AHW&quot; unless this is a verified AHW corporate project." />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="linkedProjectSlug">Linked project slug (optional)</label>
        <input className={styles.input} id="linkedProjectSlug" name="linkedProjectSlug" defaultValue={entry?.linkedProjectSlug ?? ''} placeholder="Only rendered as a link if it matches a real project" />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="experienceCategory">Experience category</label>
          <select className={styles.select} id="experienceCategory" name="experienceCategory" defaultValue={entry?.experienceCategory ?? 'TEAM_PROFESSIONAL_EXPERIENCE'}>
            {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="displayOrder">Display order</label>
          <input className={styles.input} id="displayOrder" name="displayOrder" type="number" defaultValue={entry?.displayOrder ?? 0} />
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Internal Information</h3>
      <p className={styles.cardMeta}>Never shown on the public frontend.</p>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="status">Status</label>
          <select className={styles.select} id="status" name="status" defaultValue={entry?.status ?? 'REVIEW_REQUIRED'}>
            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="confidence">Confidence</label>
          <input className={styles.input} id="confidence" name="confidence" defaultValue={entry?.confidence ?? ''} placeholder="e.g. Client-stated, Client-confirmed" />
        </div>
      </div>

      <div className={styles.checkboxRow}>
        <input type="checkbox" id="publicDisplay" name="publicDisplay" defaultChecked={entry?.publicDisplay ?? false} />
        <label htmlFor="publicDisplay">Public Display — publish this entry on /residential (also requires Status = Verified)</label>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="internalNotes">Internal evidence / notes</label>
        <textarea className={styles.textarea} id="internalNotes" name="internalNotes" defaultValue={entry?.internalNotes ?? ''} />
      </div>
    </ActionForm>
  );
}

export function ArchiveResidentialExperienceForm({ id }: { id: string }) {
  return (
    <ActionForm action={archiveResidentialExperience} submitLabel="Archive" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}

export function RestoreResidentialExperienceForm({ id }: { id: string }) {
  return (
    <ActionForm action={restoreResidentialExperience} submitLabel="Restore" className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}

export function DeleteResidentialExperienceForm({ id }: { id: string }) {
  return (
    <ActionForm action={deleteResidentialExperience} submitLabel="Delete permanently" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}
