'use client';

import { updatePortalSettings } from '../../../../lib/portal/actions/client-portal-settings';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

interface Settings {
  enabled: boolean;
  maintenanceMode: boolean;
  allowInvitations: boolean;
  welcomeMessage: string | null;
  portalLogoAssetId: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
}

export function PortalSettingsForm({ settings, logoOptions }: { settings: Settings; logoOptions: { id: string; fileName: string }[] }) {
  return (
    <ActionForm action={updatePortalSettings} submitLabel="Save">
      <div className={styles.formRow}>
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="enabled" value="true" defaultChecked={settings.enabled} />
          Enable Portal
        </label>
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="maintenanceMode" value="true" defaultChecked={settings.maintenanceMode} />
          Maintenance Mode
        </label>
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="allowInvitations" value="true" defaultChecked={settings.allowInvitations} />
          Allow Invitations
        </label>
      </div>
      {/* Unchecked checkboxes send nothing — these hidden fields are
          overridden by the checked box above when present, giving the
          server action an explicit 'false' either way. */}
      <input type="hidden" name="enabled" value="false" />
      <input type="hidden" name="maintenanceMode" value="false" />
      <input type="hidden" name="allowInvitations" value="false" />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="welcomeMessage">Welcome message</label>
        <textarea className={styles.textarea} id="welcomeMessage" name="welcomeMessage" rows={3} defaultValue={settings.welcomeMessage ?? ''} placeholder="Shown on the Coming Soon / login screen" />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="portalLogoAssetId">Portal logo</label>
          <select className={styles.select} id="portalLogoAssetId" name="portalLogoAssetId" defaultValue={settings.portalLogoAssetId ?? ''}>
            <option value="">Use default site logo</option>
            {logoOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.fileName}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="supportEmail">Support email</label>
          <input className={styles.input} id="supportEmail" name="supportEmail" type="email" defaultValue={settings.supportEmail ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="supportPhone">Support phone</label>
          <input className={styles.input} id="supportPhone" name="supportPhone" defaultValue={settings.supportPhone ?? ''} />
        </div>
      </div>
    </ActionForm>
  );
}
