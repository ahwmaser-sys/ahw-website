import type { Metadata } from 'next';
import { TrackedPhoneLink } from '@agp/ui-components';
import { getActiveOfficesForDisplay } from '../../../lib/portal/offices';
import { getSiteUrl } from '../../../lib/site-config';
import { getCapabilityStatementQrCodes } from '../qrcodes';
import {
  firmOverview,
  firmPromise,
  stats,
  whyAhw,
  services,
  audiences,
  approach,
  designBuildComparison,
  qualityAssurance,
  clients,
  clientExpectations,
  projectsSectionTitle,
  projectsSectionNote,
  featuredWork,
  coverImage,
  firmImage,
} from '../content';
import styles from './Print.module.css';

// Print-only utility route: the target Puppeteer navigates to when
// regenerating AHW_Capability_Statement.pdf. Not meant for organic
// discovery or normal browsing.
export const metadata: Metadata = {
  title: 'Capability Statement — Print',
  robots: { index: false, follow: false },
};

// REVERTED from `dynamic = 'force-dynamic'` — see capability-statement/
// page.tsx's comment: forcing this route dynamic caused a live 500 in
// production (QR generation is too slow to finish inside a synchronous
// render). Back to revalidate=30 — a known, real staleness limitation,
// not a safe one to force-fix without changing QR generation itself.
export const revalidate = 30;

// The web page uses next/image, which serves auto-resized/compressed
// variants — but this print route renders plain <img> tags at the
// original source resolution (some source files are 5-8MB, 4000px+ on a
// side), which bloated the exported PDF to 16.5MB. Pre-resized/compressed
// copies (see apps/public-site/public/capability-statement-assets/) keep
// this print route's output a reasonable size without touching the
// originals content.ts points web-side consumers at.
const printImageOverrides: Record<string, string> = {
  '/homepage-assets/hero/04-ahw-hero-background.jpg': '/capability-statement-assets/cover.jpg',
  '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-exterior-facade-yjjb.jpg': '/capability-statement-assets/firm.jpg',
  '/homepage-assets/hero/05-aurea-social-house-exterior.png': '/capability-statement-assets/work-aurea.jpg',
  '/homepage-assets/hero/06-beit-al-watan-facade-night.png': '/capability-statement-assets/work-beit-al-watan.jpg',
  '/homepage-assets/hero/01-khiran-chalet-interior-detail.jpg': '/capability-statement-assets/work-khiran-chalet.jpg',
  '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-26-925j.jpg': '/capability-statement-assets/work-lawyer-office.jpg',
  '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-exterior-facade-4cks.png': '/capability-statement-assets/work-samsung.jpg',
};

function printSrc(original: string): string {
  return printImageOverrides[original] ?? original;
}

// Plain <img>, not next/image: Puppeteer renders this route directly as
// static HTML at a fixed viewport, so none of next/image's responsive
// srcset/lazy-loading machinery applies — a plain tag prints exactly
// what's asked for, with zero risk of an unresolved blur placeholder.
const P = ({ src, alt, className }: { src: string; alt: string; className?: string | undefined }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} className={className} />
);

export default async function CapabilityStatementPrint() {
  const [workHero, ...workRest] = featuredWork;
  const [offices, siteUrl] = await Promise.all([getActiveOfficesForDisplay(), getSiteUrl()]);
  const qrCodes = await getCapabilityStatementQrCodes(siteUrl);
  const codesFor = (officeId: string) => qrCodes.byOffice.find((q) => q.officeId === officeId)?.codes ?? [];
  const displayUrl = siteUrl.replace(/^https?:\/\//, '');

  return (
    <div className={styles.doc}>
      {/* ── PAGE 1 — COVER ── */}
      <section className={`${styles.page} ${styles.cover}`}>
        <P src={printSrc(coverImage)} alt="" className={styles.coverImage} />
        <div className={styles.coverScrim} />
        <div className={styles.coverContent}>
          <P src="/images/logo-white.webp" alt="AHW Architects" className={styles.coverLogo} />
          <div className={styles.coverRule} />
          <span className={styles.coverKicker}>Design &middot; Build &middot; Deliver</span>
          <h1 className={styles.coverTitle}>Capability<br />Statement</h1>
          <p className={styles.coverTag}>An executive overview for developers, corporate clients, and delivery partners.</p>
        </div>
        <p className={styles.coverFooter}>{offices.map((o) => o.country).join(' · ')} &middot; {new Date().getFullYear()}</p>
      </section>

      {/* ── PAGE 2 — ABOUT AHW ── */}
      <section className={styles.page}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>01 &mdash; About AHW</span>
        </div>
        <div className={styles.firmGrid}>
          <div className={styles.firmText}>
            <h2 className={styles.h2}>Better projects,<br />not just better buildings.</h2>
            <p className={styles.lead}>{firmOverview}</p>
            <p className={styles.body}>{firmPromise}</p>
          </div>
          <div className={styles.firmImageWrap}>
            <P src={printSrc(firmImage)} alt="AHW Architects studio, Cairo" className={styles.firmImage} />
          </div>
        </div>
        <div className={styles.statsBand}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              {'todo' in s && s.todo ? (
                <>
                  <span className={`${styles.statValue} ${styles.statValueTodo}`}>—</span>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statTodoTag}>Owner to confirm</span>
                </>
              ) : (
                <>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── PAGE 3 — WHY CLIENTS CHOOSE AHW ── */}
      <section className={styles.page}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>02 &mdash; Why Clients Choose AHW</span>
          <h2 className={styles.h2}>A single team, accountable<br />for the whole outcome.</h2>
        </div>
        <div className={styles.whyGrid}>
          {whyAhw.map((w) => (
            <div key={w.title} className={styles.whyItem}>
              <h3 className={styles.whyTitle}>{w.title}</h3>
              <p className={styles.whyDesc}>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAGE 4 — WHAT WE DO ── */}
      <section className={styles.page}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>03 &mdash; What We Do</span>
          <h2 className={styles.h2}>Six disciplines, one accountable team.</h2>
        </div>
        <div className={styles.whatWeDoBody}>
          <div className={styles.serviceCardGrid}>
            {services.map((s) => (
              <div key={s.title} className={styles.serviceCard}>
                <h3 className={styles.serviceCardTitle}>{s.title}</h3>
                <p className={styles.serviceCardDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className={styles.audiencesWrap}>
            <span className={styles.eyebrowSmall}>Who We Work With</span>
            <div className={styles.audiencesRow}>
              {audiences.map((a) => (
                <span key={a} className={styles.audienceChip}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAGE 5 — OUR APPROACH ── */}
      <section className={styles.page}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>04 &mdash; Our Approach</span>
          <h2 className={styles.h2}>A rigorous, repeatable process.</h2>
        </div>
        <div className={styles.methodGrid}>
          {approach.map((m) => (
            <div key={m.number} className={styles.methodItem}>
              <span className={styles.methodNumber}>{m.number}</span>
              <div>
                <h3 className={styles.methodTitle}>{m.title}</h3>
                <p className={styles.methodDesc}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAGE 6 — WHY DESIGN & BUILD ── */}
      <section className={styles.page}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>05 &mdash; {designBuildComparison.headline}</span>
          <p className={styles.compareIntro}>{designBuildComparison.intro}</p>
        </div>
        <div className={styles.compareGrid}>
          <div className={styles.compareCol}>
            <span className={styles.compareLabel}>{designBuildComparison.traditional.label}</span>
            <div className={styles.compareFlow}>
              {designBuildComparison.traditional.steps.map((step) => (
                <div key={step} className={styles.compareStep}>{step}</div>
              ))}
            </div>
            <div className={`${styles.compareOutcome} ${styles.compareOutcomeBad}`}>{designBuildComparison.traditional.outcome}</div>
          </div>
          <div className={styles.compareCol}>
            <span className={styles.compareLabel}>{designBuildComparison.ahw.label}</span>
            <div className={styles.compareFlow}>
              {designBuildComparison.ahw.steps.map((step) => (
                <div key={step} className={`${styles.compareStep} ${styles.compareStepGood}`}>{step}</div>
              ))}
            </div>
            <div className={`${styles.compareOutcome} ${styles.compareOutcomeGood}`}>{designBuildComparison.ahw.outcome}</div>
          </div>
        </div>
      </section>

      {/* ── PAGE 7 — QUALITY ASSURANCE & RISK MANAGEMENT ── */}
      <section className={styles.page}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>06 &mdash; Quality Assurance &amp; Risk Management</span>
          <h2 className={styles.h2}>Discipline that protects<br />the investment.</h2>
        </div>
        <div className={styles.qaGrid}>
          {qualityAssurance.map((q) => (
            <div key={q.title} className={styles.qaItem}>
              <h3 className={styles.qaTitle}>{q.title}</h3>
              <p className={styles.qaDesc}>{q.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAGE 8 — REPRESENTATIVE PROJECTS I (single dominant image) ── */}
      <section className={`${styles.page} ${styles.workHeroPage}`}>
        {workHero && (
          <>
            <P src={printSrc(workHero.image)} alt={workHero.title} className={styles.workHeroImage} />
            <div className={styles.workHeroScrim} />
            <div className={styles.workHeroCaption}>
              <span className={styles.eyebrowLight}>07 &mdash; {projectsSectionTitle}</span>
              <h2 className={styles.workHeroTitle}>{workHero.title}</h2>
              <p className={styles.workHeroMeta}>{workHero.sector} &middot; {workHero.location} &middot; {workHero.stat}</p>
            </div>
          </>
        )}
      </section>

      {/* ── PAGE 9 — REPRESENTATIVE PROJECTS II (curated grid) ── */}
      <section className={styles.page}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>07 &mdash; {projectsSectionTitle}, continued</span>
        </div>
        <div className={styles.workGrid}>
          {workRest.map((w) => (
            <div key={w.slug} className={`${styles.workGridItem} ${w.orientation === 'portrait' ? styles.workGridItemTall : ''}`}>
              <P src={printSrc(w.image)} alt={w.title} className={styles.workGridImage} />
              <div className={styles.workGridCaption}>
                <h3 className={styles.workGridTitle}>{w.title}</h3>
                <p className={styles.workGridMeta}>{w.sector} &middot; {w.location}</p>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.workNote}>{projectsSectionNote}</p>
      </section>

      {/* ── PAGE 10 — TRUSTED BY + WHAT CLIENTS CAN EXPECT ── */}
      <section className={styles.page}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>08 &mdash; Trusted By</span>
        </div>
        <div className={styles.trustedBody}>
          <div className={styles.clientRow}>
            {clients.map((c) => (
              <span key={c} className={styles.clientName}>{c}</span>
            ))}
          </div>
          <div className={styles.expectHead}>
            <span className={styles.eyebrow}>What Clients Can Expect</span>
          </div>
          <div className={styles.expectGrid}>
            {clientExpectations.map((e) => (
              <div key={e.title} className={styles.expectItem}>
                <h3 className={styles.expectTitle}>{e.title}</h3>
                <p className={styles.expectDesc}>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAGE 11 — CONTACT ── */}
      <section className={`${styles.page} ${styles.closePage}`}>
        <div className={styles.closeStatement}>
          <span className={styles.eyebrowLight}>Let&apos;s Talk</span>
          <h2 className={styles.closeHeadline}>Let&apos;s discuss<br />your next project.</h2>
        </div>

        <div className={styles.contactGrid}>
          {offices.map((office) => {
            const codes = codesFor(office.id);
            return (
              <div key={office.id} className={styles.officeBlock}>
                <h3 className={styles.officeTitle}>
                  {office.displayName}
                  {office.isHeadquarters && <span className={styles.hqTag}>Head Office</span>}
                </h3>
                <p className={styles.officeAddress}>{office.address.full}</p>
                {office.contact.phones.map((phone) => (
                  <TrackedPhoneLink key={phone} phone={phone} className={styles.officeLine} />
                ))}
                <a href={`mailto:${office.contact.primaryEmail}`} className={styles.officeLine}>{office.contact.primaryEmail}</a>
                {codes.length > 0 && (
                  <div className={styles.officeQrRow}>
                    {codes.map((qr) => (
                      <div key={qr.label} className={styles.officeQr}>
                        <P src={qr.dataUri} alt={`QR code — ${office.displayName} ${qr.label}`} className={styles.officeQrImage} />
                        <span className={styles.officeQrLabel}>{qr.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {qrCodes.website && (
          <div className={styles.qrRow}>
            <div className={styles.qrItem}>
              <P src={qrCodes.website.dataUri} alt="QR code linking to the AHW Architects website" className={styles.qrImage} />
              <span className={styles.qrLabel}>{qrCodes.website.label}</span>
            </div>
          </div>
        )}

        <div className={styles.closeFooter}>
          <P src="/images/logo-white.webp" alt="AHW Architects" className={styles.closeLogo} />
          <p className={styles.closeWeb}>{displayUrl}</p>
        </div>
      </section>
    </div>
  );
}
