'use client';

import { createPortfolioProject } from '../../../lib/portal/actions/portfolio';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

const SECTOR_OPTIONS = ['RESIDENTIAL', 'COMMERCIAL', 'HOSPITALITY', 'WORKPLACE', 'RETAIL'];
const MARKET_OPTIONS = ['EGYPT', 'KUWAIT', 'UAE', 'LEBANON'];
const TIER_OPTIONS = ['FLAGSHIP', 'STANDARD'];

export function CreatePortfolioProjectForm() {
  return (
    <ActionForm action={createPortfolioProject} submitLabel="Create project">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input className={styles.input} id="title" name="title" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="city">City</label>
        <input className={styles.input} id="city" name="city" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sector">Sector</label>
        <select className={styles.select} id="sector" name="sector" defaultValue="RESIDENTIAL">
          {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="market">Market</label>
        <select className={styles.select} id="market" name="market" defaultValue="EGYPT">
          {MARKET_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="tier">Tier</label>
        <select className={styles.select} id="tier" name="tier" defaultValue="STANDARD">
          {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <p className={styles.hint}>Flagship projects are featured first, in the site nav and on the listing page.</p>
      </div>
    </ActionForm>
  );
}
