import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { getActiveBrandKit } from '../../../lib/portal/brand-kit';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { ColorsForm, TypographyForm, CtaStyleForm, LogosForm, WatermarkForm, QrStyleForm } from './BrandKitForms';
import { CompanyInfoForm, DefaultCtaForm, DefaultHashtagsForm, BrandVoiceForm, FooterSettingsForm, WebsiteDomainForm } from './BrandKitExtensionForms';
import { QrCodeGenerator } from './QrCodeGenerator';
import styles from '../../../components/portal/portal-ui.module.css';
import type {
  BrandColors,
  BrandTypography,
  CtaStyle,
  BrandLogos,
  BrandWatermark,
  BrandQrStyle,
  BrandCompanyInfo,
  BrandDefaultCta,
  BrandFooterSettings,
} from '../../../lib/portal/brand-kit';

export default async function AdminBrandKitPage() {
  const principal = await requireAdminPage();
  const kit = await getActiveBrandKit();

  const logoOptions = await prisma.mediaAsset.findMany({
    where: { kind: { in: ['LOGO', 'ICON'] } },
    select: { id: true, fileName: true },
    orderBy: { createdAt: 'desc' },
  });

  const colors = kit.colors as unknown as BrandColors;
  const typography = kit.typography as unknown as BrandTypography;
  const ctaStyles = kit.ctaStyles as unknown as Record<string, CtaStyle>;
  const logos = kit.logos as unknown as BrandLogos;
  const watermark = kit.watermark as unknown as BrandWatermark | null;
  const qrStyle = kit.qrCodeStyle as unknown as BrandQrStyle | null;
  const companyInfo = kit.companyInfo as unknown as BrandCompanyInfo;
  const defaultCta = kit.defaultCta as unknown as BrandDefaultCta;
  const footerSettings = kit.footerSettings as unknown as BrandFooterSettings;

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Brand Kit</h1>
      </div>
      <p className={styles.subtitle}>
        Global Company — legal identity, visual brand, and the website domain. Per-office contact details, addresses,
        working hours, and social accounts now live in <Link href="/admin/offices">Offices</Link>, not here.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Company information</h2>
        <CompanyInfoForm info={companyInfo} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Website domain</h2>
        <p className={styles.cardMeta}>
          The one public address for this site — drives canonical URLs, Open Graph tags, the sitemap, QR codes,
          generated PDFs, and every email template&apos;s links. Changing it never renames the company (see Company
          information above).
        </p>
        <WebsiteDomainForm websiteUrl={kit.websiteUrl} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Default CTA</h2>
        <DefaultCtaForm cta={defaultCta} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Default hashtags</h2>
        <DefaultHashtagsForm hashtags={kit.defaultHashtags} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Brand voice & email signature</h2>
        <BrandVoiceForm brandVoice={kit.brandVoice} emailSignature={kit.emailSignature} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Footer settings</h2>
        <FooterSettingsForm settings={footerSettings} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Colors</h2>
        <ColorsForm colors={colors} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Typography</h2>
        <TypographyForm typography={typography} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>CTA styles</h2>
        <div className={styles.cardList}>
          {Object.entries(ctaStyles).map(([key, style]) => (
            <div key={key} className={styles.card}>
              <strong>{key}</strong>
              <CtaStyleForm ctaKey={key} style={style} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Logos</h2>
        <LogosForm logos={logos} options={logoOptions} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Watermark</h2>
        <WatermarkForm watermark={watermark} options={logoOptions} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>QR code style</h2>
        <QrStyleForm qrStyle={qrStyle} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Generate a QR code</h2>
        <QrCodeGenerator defaultContent={kit.websiteUrl} />
      </div>
    </PortalShell>
  );
}
