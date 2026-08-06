import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { CreateOfficeForm } from './CreateOfficeForm';
import styles from '../../../components/portal/portal-ui.module.css';

export default async function AdminOfficesPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const principal = await requireAdminPage();
  const { archived } = await searchParams;
  const showArchived = archived === '1';

  const offices = await prisma.office.findMany({
    where: { status: showArchived ? 'ARCHIVED' : 'ACTIVE' },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { clients: true, projects: true } } },
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Offices</h1>
        <Link href={showArchived ? '/admin/offices' : '/admin/offices?archived=1'} className={styles.linkButton}>
          {showArchived ? '← Back to offices' : 'View archived'}
        </Link>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Office</th>
                <th>Country / City</th>
                <th>Slug</th>
                <th>Clients</th>
                <th>Projects</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {offices.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={6}>{showArchived ? 'No archived offices.' : 'No offices yet — add one below. Every office is created here, never in code.'}</td>
                </tr>
              )}
              {offices.map((office) => (
                <tr key={office.id}>
                  <td>
                    {office.displayName}
                    {office.isHeadquarters && <span className={`${styles.badge} ${styles.badgeActive}`} style={{ marginLeft: 8 }}>HQ</span>}
                  </td>
                  <td>{office.country} · {office.city}</td>
                  <td>{office.slug}</td>
                  <td>{office._count.clients}</td>
                  <td>{office._count.projects}</td>
                  <td>
                    <Link href={`/admin/offices/${office.id}`}>Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!showArchived && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Add an office</h2>
          <p className={styles.cardMeta}>
            Unlimited offices — add UAE, Saudi Arabia, Qatar, or any future location here. Nothing about office count is hardcoded anywhere in the app.
          </p>
          <CreateOfficeForm />
        </div>
      )}
    </PortalShell>
  );
}
