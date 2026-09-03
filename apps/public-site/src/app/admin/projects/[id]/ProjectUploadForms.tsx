'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { deletePhoto, deleteDocument } from '../../../../lib/portal/actions/projects';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

// Uploads straight from the browser to Blob storage (Vercel's own
// documented client-upload pattern) instead of posting the file through
// a Server Action — a Server Action's body is subject to Vercel's
// platform-level request-size ceiling on serverless Functions (~4.5MB),
// which no app-level limit can lift. Confirmed live: a 20MB PDF failed
// silently (no server error ever logged) before this change. The actual
// database row gets created by the token route's onUploadCompleted
// webhook, which normally lands within a second or two of the upload
// finishing — the short delay before refreshing below gives it time to
// land before the list re-renders.
function useUploadForm(onSuccess: () => void) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function run(task: () => Promise<string>) {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const message = await task();
      setSuccess(message);
      onSuccess();
      setTimeout(() => router.refresh(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setPending(false);
    }
  }

  return { pending, error, success, run };
}

export function UploadDocumentForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, error, success, run } = useUploadForm(() => formRef.current?.reset());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const categoryInput = form.elements.namedItem('category') as HTMLSelectElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    void run(async () => {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/portal/uploads/document-token',
        clientPayload: JSON.stringify({ projectId, category: categoryInput.value, fileName: file.name, fileSize: file.size }),
      });
      return `${blob.pathname.split('/').pop() ?? file.name} uploaded.`;
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={styles.formSpacer}>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="docCategory">Category</label>
          <select className={styles.select} id="docCategory" name="category" defaultValue="OTHER">
            <option value="DRAWING">Drawing</option>
            <option value="CONTRACT">Contract</option>
            <option value="BOQ">BOQ</option>
            <option value="REPORT">Report</option>
            <option value="WARRANTY">Warranty</option>
            <option value="INVOICE">Invoice</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="docFile">File</label>
          <input className={styles.input} id="docFile" name="file" type="file" required />
        </div>
      </div>
      {error && <p className={styles.errorMessage} role="alert">{error}</p>}
      {success && <p className={styles.successMessage} role="status">{success}</p>}
      <div className={styles.buttonRow}>
        <button type="submit" className={styles.button} disabled={pending}>{pending ? 'Uploading…' : 'Upload document'}</button>
      </div>
    </form>
  );
}

export function UploadPhotoForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, error, success, run } = useUploadForm(() => formRef.current?.reset());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const phaseInput = form.elements.namedItem('phase') as HTMLSelectElement;
    const captionInput = form.elements.namedItem('caption') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    void run(async () => {
      await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/portal/uploads/photo-token',
        clientPayload: JSON.stringify({ projectId, phase: phaseInput.value, caption: captionInput.value || undefined, fileSize: file.size }),
      });
      return 'Photo uploaded.';
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={styles.formSpacer}>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="photoPhase">Phase</label>
          <select className={styles.select} id="photoPhase" name="phase" defaultValue="DURING">
            <option value="BEFORE">Before</option>
            <option value="DURING">During</option>
            <option value="AFTER">After</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="photoFile">Image</label>
          <input className={styles.input} id="photoFile" name="file" type="file" accept="image/*" required />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="photoCaption">Caption (optional)</label>
        <input className={styles.input} id="photoCaption" name="caption" />
      </div>
      {error && <p className={styles.errorMessage} role="alert">{error}</p>}
      {success && <p className={styles.successMessage} role="status">{success}</p>}
      <div className={styles.buttonRow}>
        <button type="submit" className={styles.button} disabled={pending}>{pending ? 'Uploading…' : 'Upload photo'}</button>
      </div>
    </form>
  );
}

export function DeletePhotoButton({ photoId, projectId }: { photoId: string; projectId: string }) {
  return (
    <ActionForm action={deletePhoto} submitLabel="Delete" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="photoId" value={photoId} />
      <input type="hidden" name="projectId" value={projectId} />
    </ActionForm>
  );
}

export function DeleteDocumentButton({ documentId, projectId }: { documentId: string; projectId: string }) {
  return (
    <ActionForm action={deleteDocument} submitLabel="Delete" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="projectId" value={projectId} />
    </ActionForm>
  );
}
