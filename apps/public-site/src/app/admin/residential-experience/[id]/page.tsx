import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { getResidentialExperienceById } from '../../../../lib/portal/residential-experience';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import {
  ResidentialExperienceForm,
  ArchiveResidentialExperienceForm,
  RestoreResidentialExperienceForm,
  DeleteResidentialExperienceForm,
} from '../ResidentialExperienceForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ResidentialExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireSuperAdminPage();
  const { id } = await params;

  const entry = await getResidentialExperienceById(id);
  if (!entry) notFound();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/residential-experience" className={styles.backLink}>← Residential Experience</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{entry.name}</h1>
        {entry.archivedAt && <span className={`${styles.badge} ${styles.badgeMuted}`}>Archived</span>}
      </div>

      <div className={styles.section}>
        {/* key forces a full remount whenever the row actually changes
            server-side (updatedAt only advances on a real write) — without
            it, React 19 resets this form's uncontrolled inputs/selects back
            to whatever defaultValue was at the page's ORIGINAL load after a
            successful save, which visually looks exactly like "my change
            didn't save" even though the database write succeeded. Keying on
            updatedAt makes the form re-mount with the true post-save values
            instead of snapping back to the stale ones. */}
        <ResidentialExperienceForm key={entry.updatedAt.toISOString()} entry={entry} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        {entry.archivedAt ? <RestoreResidentialExperienceForm id={entry.id} /> : <ArchiveResidentialExperienceForm id={entry.id} />}
        <DeleteResidentialExperienceForm id={entry.id} />
      </div>
    </PortalShell>
  );
}
