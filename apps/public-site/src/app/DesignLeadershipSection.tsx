import Link from 'next/link';
import { aboutData } from '@agp/ui-components';
import styles from './DesignLeadershipSection.module.css';

// Splits on real sentence boundaries (keeping the trailing period) rather
// than a naive string index, so picking "one real sentence" from
// aboutData never risks a truncated word or a doubled/missing period —
// the text itself is never altered, only how much of it is shown.
function sentences(description: string): string[] {
  return description.match(/[^.]+\.(?:\s|$)/g)?.map((s) => s.trim()) ?? [description];
}

// Homepage's "Why AHW / Differentiation" beat, between Capabilities and
// Client Reviews (see the go-live brief's preferred conversion flow) —
// today the site's only leadership content lived on /about/about-us,
// visible to nobody who doesn't already click through About. Every name,
// title, and description below is pulled directly from aboutData.leadership
// (packages/ui-components/src/data/about.ts) — the same verified source
// the About page itself reads — never rewritten or invented here. Kept
// deliberately short (title + one real sentence each) so this stays a
// pointer toward the full story, not a second About page; the AHW brand
// name stays the section's subject, not either individual.
export function DesignLeadershipSection() {
  const [principal, managingPartner] = aboutData.leadership;
  if (!principal || !managingPartner) return null;

  return (
    <section className={styles.section} aria-labelledby="design-leadership-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Design Leadership</span>
          <h2 className={styles.title} id="design-leadership-heading">
            Design-Led. Delivered With Accountability.
          </h2>
          <p className={styles.intro}>
            Every AHW project is led by the same principals from first concept through final handover — not handed
            between a design team and an unrelated construction team along the way.
          </p>
        </div>

        <div className={styles.grid}>
          <article className={styles.profile}>
            <span className={styles.profileRole}>{principal.role}</span>
            <h3 className={styles.profileName}>{principal.name}</h3>
            <p className={styles.profileText}>{sentences(principal.description)[1] ?? sentences(principal.description)[0]}</p>
          </article>
          <article className={styles.profile}>
            <span className={styles.profileRole}>{managingPartner.role}</span>
            <h3 className={styles.profileName}>{managingPartner.name}</h3>
            <p className={styles.profileText}>{sentences(managingPartner.description)[0]}</p>
          </article>
        </div>

        <Link href="/about/about-us" className={styles.link}>Meet Our Leadership</Link>
      </div>
    </section>
  );
}
