'use client';

import {
  updateBrandColors,
  updateBrandTypography,
  upsertCtaStyle,
  updateBrandLogos,
  updateBrandWatermark,
  updateBrandQrStyle,
} from '../../../lib/portal/actions/brand-kit';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';
import type { BrandColors, BrandTypography, CtaStyle, BrandLogos, BrandWatermark, BrandQrStyle } from '../../../lib/portal/brand-kit';

export function ColorsForm({ colors }: { colors: BrandColors }) {
  return (
    <ActionForm action={updateBrandColors} submitLabel="Save colors">
      <div className={styles.formRow}>
        {(['ink', 'paper', 'stone', 'accentDark', 'accentLight'] as const).map((key) => (
          <div className={styles.field} key={key}>
            <label className={styles.label} htmlFor={key}>{key}</label>
            <input className={styles.input} id={key} name={key} type="text" defaultValue={colors[key]} />
          </div>
        ))}
      </div>
    </ActionForm>
  );
}

export function TypographyForm({ typography }: { typography: BrandTypography }) {
  return (
    <ActionForm action={updateBrandTypography} submitLabel="Save typography">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="primaryFont">Primary font (body)</label>
          <input className={styles.input} id="primaryFont" name="primaryFont" defaultValue={typography.primaryFont} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="secondaryFont">Secondary font (display)</label>
          <input className={styles.input} id="secondaryFont" name="secondaryFont" defaultValue={typography.secondaryFont} />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="weightLight">Light weight</label>
          <input className={styles.input} id="weightLight" name="weightLight" type="number" defaultValue={typography.weightLight} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="weightRegular">Regular weight</label>
          <input className={styles.input} id="weightRegular" name="weightRegular" type="number" defaultValue={typography.weightRegular} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="weightMedium">Medium weight</label>
          <input className={styles.input} id="weightMedium" name="weightMedium" type="number" defaultValue={typography.weightMedium} />
        </div>
      </div>
    </ActionForm>
  );
}

export function CtaStyleForm({ ctaKey, style }: { ctaKey: string; style: CtaStyle }) {
  return (
    <ActionForm action={upsertCtaStyle} submitLabel="Save" className={styles.formRow}>
      <input type="hidden" name="key" value={ctaKey} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${ctaKey}-label`}>Label</label>
        <input className={styles.input} id={`${ctaKey}-label`} name="label" defaultValue={style.label} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${ctaKey}-bg`}>Background</label>
        <input className={styles.input} id={`${ctaKey}-bg`} name="background" defaultValue={style.background} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${ctaKey}-fg`}>Foreground</label>
        <input className={styles.input} id={`${ctaKey}-fg`} name="foreground" defaultValue={style.foreground} />
      </div>
    </ActionForm>
  );
}

interface LogoOption {
  id: string;
  fileName: string;
}

export function LogosForm({ logos, options }: { logos: BrandLogos; options: LogoOption[] }) {
  if (options.length === 0) {
    return <p className={styles.cardMeta}>Upload a LOGO or ICON asset in the Media Library first.</p>;
  }
  return (
    <ActionForm action={updateBrandLogos} submitLabel="Save logos">
      <div className={styles.formRow}>
        {(['light', 'dark', 'icon'] as const).map((slot) => (
          <div className={styles.field} key={slot}>
            <label className={styles.label} htmlFor={`logo-${slot}`}>{slot}</label>
            <select className={styles.select} id={`logo-${slot}`} name={slot} defaultValue={logos[slot] ?? ''}>
              <option value="">None</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.fileName}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </ActionForm>
  );
}

export function WatermarkForm({ watermark, options }: { watermark: BrandWatermark | null; options: LogoOption[] }) {
  if (options.length === 0) {
    return <p className={styles.cardMeta}>Upload a LOGO or ICON asset first to use as a watermark.</p>;
  }
  return (
    <ActionForm action={updateBrandWatermark} submitLabel="Save watermark">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="watermarkAsset">Asset</label>
          <select className={styles.select} id="watermarkAsset" name="assetId" defaultValue={watermark?.assetId ?? ''}>
            <option value="">None</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.fileName}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="watermarkOpacity">Opacity (0–1)</label>
          <input className={styles.input} id="watermarkOpacity" name="opacity" type="number" step="0.05" min="0" max="1" defaultValue={watermark?.opacity ?? 0.5} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="watermarkPosition">Position</label>
          <select className={styles.select} id="watermarkPosition" name="position" defaultValue={watermark?.position ?? 'bottom-right'}>
            <option value="top-left">Top left</option>
            <option value="top-right">Top right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="bottom-right">Bottom right</option>
            <option value="center">Center</option>
          </select>
        </div>
      </div>
    </ActionForm>
  );
}

export function QrStyleForm({ qrStyle }: { qrStyle: BrandQrStyle | null }) {
  return (
    <ActionForm action={updateBrandQrStyle} submitLabel="Save QR style">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qrForeground">Foreground</label>
          <input className={styles.input} id="qrForeground" name="foreground" defaultValue={qrStyle?.foreground ?? '#0F1115'} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qrBackground">Background</label>
          <input className={styles.input} id="qrBackground" name="background" defaultValue={qrStyle?.background ?? '#F2F4F7'} />
        </div>
        <div className={styles.checkboxRow}>
          <input type="checkbox" id="qrLogoOverlay" name="logoOverlay" value="true" defaultChecked={qrStyle?.logoOverlay ?? false} />
          <label htmlFor="qrLogoOverlay">Overlay logo on QR code</label>
        </div>
      </div>
    </ActionForm>
  );
}
