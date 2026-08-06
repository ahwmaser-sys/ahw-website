import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireClientPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { AssetDownloadLink } from '../../../../components/portal/AssetDownloadLink';
import { CLIENT_NAV_LINKS } from '../../nav-links';
import { ClientMessageForm } from './ClientMessageForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default async function ClientProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireClientPage();
  const { id } = await params;

  // Scoped at the data layer, not just checked separately: the query
  // itself can only ever return this project if a ProjectMember row
  // ties it to this exact user — there is no path here that returns
  // another client's project, per C3's "hiding a button is not
  // authorization" principle.
  const membership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: principal.userId },
    include: {
      project: {
        include: {
          milestones: { orderBy: { sortOrder: 'asc' } },
          updates: { orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
          photos: { orderBy: { createdAt: 'desc' } },
          documents: { orderBy: { createdAt: 'desc' } },
          invoices: { orderBy: { createdAt: 'desc' }, include: { payments: true } },
          messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { name: true, role: true } } } },
        },
      },
    },
  });

  if (!membership) notFound();
  const { project } = membership;

  return (
    <PortalShell brand="AHW Client Portal" navLinks={CLIENT_NAV_LINKS} userLabel="Client">
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{project.name}</h1>
        <span className={styles.badge}>{project.status}</span>
      </div>
      {project.description && <p className={styles.subtitle}>{project.description}</p>}
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${project.progressPercent}%` }} />
      </div>
      <p className={styles.cardMeta}>{project.progressPercent}% complete</p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Timeline &amp; milestones</h2>
        <div className={styles.cardList}>
          {project.milestones.length === 0 && <p className={styles.cardMeta}>No milestones recorded yet.</p>}
          {project.milestones.map((milestone) => (
            <div key={milestone.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{milestone.title}</strong>
                <span className={`${styles.badge} ${milestone.completedAt ? styles.badgeActive : styles.badgeMuted}`}>
                  {milestone.completedAt ? 'Complete' : 'Pending'}
                </span>
              </div>
              <span className={styles.cardMeta}>
                {milestone.completedAt ? `Completed ${formatDate(milestone.completedAt)}` : `Due ${formatDate(milestone.dueDate)}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Project updates</h2>
        <div className={styles.cardList}>
          {project.updates.length === 0 && <p className={styles.cardMeta}>No updates yet.</p>}
          {project.updates.map((update) => (
            <div key={update.id} className={styles.card}>
              <p>{update.body}</p>
              <span className={styles.cardMeta}>{update.author.name} · {formatDate(update.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Progress gallery</h2>
        <div className={styles.cardList}>
          {project.photos.length === 0 && <p className={styles.cardMeta}>No photos uploaded yet.</p>}
          {project.photos.map((photo) => (
            <div key={photo.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.badge}>{photo.phase}</span>
                <AssetDownloadLink kind="photos" assetId={photo.id} label="View" />
              </div>
              {photo.caption && <span className={styles.cardMeta}>{photo.caption}</span>}
              <span className={styles.cardMeta}>{formatDate(photo.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Documents</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>File</th>
                <th>Category</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {project.documents.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={4}>No documents shared yet.</td>
                </tr>
              )}
              {project.documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.fileName}</td>
                  <td>{doc.category}</td>
                  <td>{formatDate(doc.createdAt)}</td>
                  <td>
                    <AssetDownloadLink kind="documents" assetId={doc.id} label="Download" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Financial summary</h2>
        <div className={styles.cardList}>
          {project.invoices.length === 0 && <p className={styles.cardMeta}>No invoices yet.</p>}
          {project.invoices.map((invoice) => {
            const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            return (
              <div key={invoice.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong>{Number(invoice.amount).toFixed(2)} {invoice.currency}</strong>
                  <span
                    className={`${styles.badge} ${
                      invoice.status === 'PAID' ? styles.badgeActive : invoice.status === 'OVERDUE' ? styles.badgeDanger : styles.badgeWarn
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                <span className={styles.cardMeta}>
                  Due {formatDate(invoice.dueDate)} · Paid {paid.toFixed(2)} / {Number(invoice.amount).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Messages</h2>
        <div className={styles.cardList}>
          {project.messages.length === 0 && <p className={styles.cardMeta}>No messages yet — send one below.</p>}
          {project.messages.map((message) => (
            <div key={message.id} className={styles.card}>
              <p>{message.body}</p>
              <span className={styles.cardMeta}>{message.sender.name} ({message.sender.role}) · {formatDate(message.createdAt)}</span>
            </div>
          ))}
        </div>
        <div className={styles.formSpacer}>
          <ClientMessageForm projectId={project.id} />
        </div>
      </div>
    </PortalShell>
  );
}
