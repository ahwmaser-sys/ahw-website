import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { AssetDownloadLink } from '../../../../components/portal/AssetDownloadLink';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { getAllOffices } from '../../../../lib/portal/offices';
import { EditProjectForm } from './ProjectSettingsForms';
import { AssignClientForm, RemoveMemberButton } from './ProjectPeopleForms';
import { AddMilestoneForm, ToggleMilestoneButton } from './ProjectMilestoneForms';
import { PostUpdateForm, ReplyMessageForm, SendNotificationForm, DeleteMessageForm } from './ProjectContentForms';
import { UploadDocumentForm, UploadPhotoForm, DeletePhotoButton, DeleteDocumentButton } from './ProjectUploadForms';
import { CreateInvoiceForm, RecordPaymentForm, DeleteInvoiceButton } from './ProjectInvoiceForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { client: true } },
      milestones: { orderBy: { sortOrder: 'asc' } },
      updates: { orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
      photos: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' }, include: { payments: true } },
      messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { name: true, role: true } } } },
    },
  });

  if (!project) notFound();

  const assignedClientIds = new Set(project.members.map((m) => m.clientId).filter(Boolean));
  const [availableClients, offices] = await Promise.all([
    prisma.client.findMany({
      where: { id: { notIn: [...assignedClientIds] as string[] }, user: { isNot: null } },
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    }),
    getAllOffices(),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/projects" className={styles.backLink}>← All projects</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{project.name}</h1>
        <span className={styles.badge}>{project.status}</span>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${project.progressPercent}%` }} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Settings</h2>
        <EditProjectForm
          projectId={project.id}
          name={project.name}
          description={project.description}
          status={project.status}
          progressPercent={project.progressPercent}
          isSuperAdmin={principal.roles.includes('SUPER_ADMIN')}
          officeId={project.officeId}
          offices={offices}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Assigned clients</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {project.members.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={2}>No client assigned yet.</td>
                </tr>
              )}
              {project.members.map((member) => (
                <tr key={member.id}>
                  <td>{member.client?.companyName ?? '—'}</td>
                  <td>
                    <RemoveMemberButton membershipId={member.id} projectId={project.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.formSpacer}>
          <AssignClientForm projectId={project.id} clients={availableClients} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Milestones</h2>
        <div className={styles.cardList}>
          {project.milestones.length === 0 && <p className={styles.cardMeta}>No milestones yet.</p>}
          {project.milestones.map((milestone) => (
            <div key={milestone.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{milestone.title}</strong>
                <span className={`${styles.badge} ${milestone.completedAt ? styles.badgeActive : styles.badgeMuted}`}>
                  {milestone.completedAt ? 'Complete' : 'Pending'}
                </span>
              </div>
              <span className={styles.cardMeta}>Due {formatDate(milestone.dueDate)}</span>
              <ToggleMilestoneButton milestoneId={milestone.id} projectId={project.id} completed={Boolean(milestone.completedAt)} />
            </div>
          ))}
        </div>
        <div className={styles.formSpacer}>
          <AddMilestoneForm projectId={project.id} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Project updates</h2>
        <div className={styles.cardList}>
          {project.updates.length === 0 && <p className={styles.cardMeta}>No updates posted yet.</p>}
          {project.updates.map((update) => (
            <div key={update.id} className={styles.card}>
              <p>{update.body}</p>
              <span className={styles.cardMeta}>{update.author.name} · {formatDate(update.createdAt)}</span>
            </div>
          ))}
        </div>
        <div className={styles.formSpacer}>
          <PostUpdateForm projectId={project.id} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Photos</h2>
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
              <DeletePhotoButton photoId={photo.id} projectId={project.id} />
            </div>
          ))}
        </div>
        <div className={styles.formSpacer}>
          <UploadPhotoForm projectId={project.id} />
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
                <th>Uploaded</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {project.documents.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>No documents uploaded yet.</td>
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
                  <td>
                    <DeleteDocumentButton documentId={doc.id} projectId={project.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.formSpacer}>
          <UploadDocumentForm projectId={project.id} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Invoices</h2>
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
                {invoice.status !== 'PAID' && <RecordPaymentForm invoiceId={invoice.id} projectId={project.id} />}
                {invoice.payments.length === 0 && <DeleteInvoiceButton invoiceId={invoice.id} projectId={project.id} />}
              </div>
            );
          })}
        </div>
        <div className={styles.formSpacer}>
          <CreateInvoiceForm projectId={project.id} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Messages</h2>
        <div className={styles.cardList}>
          {project.messages.length === 0 && <p className={styles.cardMeta}>No messages yet.</p>}
          {project.messages.map((message) => (
            <div key={message.id} className={styles.card}>
              <p>{message.body}</p>
              <span className={styles.cardMeta}>{message.sender.name} ({message.sender.role}) · {formatDate(message.createdAt)}</span>
              <DeleteMessageForm messageId={message.id} projectId={project.id} />
            </div>
          ))}
        </div>
        <div className={styles.formSpacer}>
          <ReplyMessageForm projectId={project.id} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Send notification</h2>
        <SendNotificationForm projectId={project.id} />
      </div>
    </PortalShell>
  );
}
