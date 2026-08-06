import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { getAllOffices } from '../../../../lib/portal/offices';
import { UpdateClientForm, ToggleClientStatusForm, ResetClientPasswordForm, ArchiveClientForm, RestoreClientForm, DeleteClientForm } from './ClientDetailForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const [client, offices] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        user: true,
        memberships: { include: { project: true } },
      },
    }),
    getAllOffices(),
  ]);

  if (!client) notFound();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/clients" className={styles.backLink}>← All clients</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{client.companyName}</h1>
        <div className={styles.buttonRow}>
          {client.archivedAt && <span className={`${styles.badge} ${styles.badgeMuted}`}>Archived</span>}
          {client.user && (
            <span className={`${styles.badge} ${client.user.status === 'ACTIVE' ? styles.badgeActive : styles.badgeDanger}`}>
              {client.user.status}
            </span>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Company details</h2>
        <UpdateClientForm clientId={client.id} companyName={client.companyName} officeId={client.officeId} offices={offices} />
      </div>

      {client.user && (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Account</h2>
            <p className={styles.subtitle}>{client.user.email}</p>
            <div className={styles.formSpacer}>
              <ToggleClientStatusForm userId={client.user.id} clientId={client.id} currentStatus={client.user.status} />
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Reset password</h2>
            <ResetClientPasswordForm userId={client.user.id} clientId={client.id} />
          </div>
        </>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {client.memberships.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={4}>Not assigned to any project yet.</td>
                </tr>
              )}
              {client.memberships.map((membership) => (
                <tr key={membership.id}>
                  <td>{membership.project.name}</td>
                  <td>{membership.project.status}</td>
                  <td>{membership.project.progressPercent}%</td>
                  <td>
                    <Link href={`/admin/projects/${membership.project.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        {client.archivedAt ? <RestoreClientForm clientId={client.id} /> : <ArchiveClientForm clientId={client.id} />}
        {client.memberships.length === 0 && <DeleteClientForm clientId={client.id} />}
      </div>
    </PortalShell>
  );
}
