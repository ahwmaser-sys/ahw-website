import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { projects, publications, newsItems, NativeReveal, StructuredData, HeroSlider, buildWhatsAppLink, Breadcrumbs, buildBreadcrumbJsonLd, isCommercialSector, sortByDisplayOrder } from '@agp/ui-components';
import ProjectFilterBar from '../../../components/ProjectFilterBar';
import { recordPageView } from '../../../lib/portal/analytics/track';
import { getActiveOfficesForDisplay } from '../../../lib/portal/offices';
import { getSiteUrl } from '../../../lib/site-config';
import styles from './page.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({
    slug: p.slug,
  }));
}

// All valid slugs are already enumerated above — projects.ts is static,
// build-time data, not a CMS/database that could gain a new valid slug
// between builds. Rejecting anything else at the routing layer (rather
// than the default dynamicParams=true, which renders on-demand and only
// then calls notFound()) is both more correct and sidesteps a real
// Next.js issue where a route with a Suspense boundary in its render
// path streams a 200 before an in-page notFound() can flip the status.
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const project = projects.find((p) => p.slug === resolvedParams.slug);
  if (!project) return { title: 'Project Not Found' };

  const seo = project.caseStudy?.narrative?.seo;

  // Computed once so title/description/OG/Twitter can never fall out of sync
  // with each other, and so OG/Twitter are never left undefined for a
  // project that doesn't yet have a narrative.seo block.
  const rawTitle = seo?.title || `${project.title} — ${project.sector} Project in ${project.city}`;
  const description = seo?.description || (project.caseStudy
    ? project.caseStudy.brief.definitionalSentence.substring(0, 155)
    : `${project.title} by AHW Architects.`);

  // The root layout's title.template appends "| AHW Architects" to every
  // page title automatically. Some projects' authored narrative.seo.title
  // already ends with that same suffix (written as a complete, standalone
  // title), which would otherwise render doubled in the <title> tag —
  // strip it here for that one field. OG/Twitter titles aren't run through
  // the template, so they keep whatever the source (seo.title or the
  // fallback above) actually says.
  const pageTitle = rawTitle.replace(/\s*\|\s*AHW Architects\s*$/i, '');

  return {
    title: pageTitle,
    description,
    keywords: seo ? [seo.focusKeyword, ...seo.secondaryKeywords] : undefined,
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      title: seo?.ogTitle || rawTitle,
      description: seo?.ogDescription || description,
      url: `/projects/${project.slug}`,
      images: [project.ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.twitterTitle || rawTitle,
      description: seo?.twitterDescription || description,
      images: [project.ogImage],
    },
  };
}

/* ─────────────────────────────────────────
   Image Moments — editorial layout engine
   Maps an array of images into a beautiful
   visual composition based on image count.
   ───────────────────────────────────────── */
function ImageMoments({
  images,
  projectTitle,
  label,
}: {
  images: string[];
  projectTitle: string;
  label: string;
}) {
  const count = images.length;

  // 1 image → full cinematic banner
  if (count === 1) {
    return (
      <div className={styles.imageMoments}>
        <NativeReveal behavior="aperture" className={`${styles.momentItem} ${styles.momentWide}`}>
          <Image
            src={images[0]!}
            alt={`${projectTitle} — ${label}`}
            fill
            sizes="100vw"
            quality={100}
            className={styles.momentImage}
            draggable={false}
          />
        </NativeReveal>
      </div>
    );
  }

  // 2 images → duo portraits side by side
  if (count === 2) {
    return (
      <div className={styles.imageMoments}>
        <div className={styles.momentDuo}>
          {images.map((img, i) => (
            <NativeReveal key={i} behavior="aperture" delay={i * 0.12} className={styles.momentItem}>
              <Image
                src={img}
                alt={`${projectTitle} — ${label} ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 50vw"
                quality={100}
                className={styles.momentImage}
                draggable={false}
              />
            </NativeReveal>
          ))}
        </div>
      </div>
    );
  }

  // 3 images → feature + aside (dominant + accent)
  if (count === 3) {
    return (
      <div className={styles.imageMoments}>
        {/* First image: wide banner */}
        <NativeReveal behavior="aperture" className={`${styles.momentItem} ${styles.momentWide}`}>
          <Image
            src={images[0]!}
            alt={`${projectTitle} — ${label} 1`}
            fill
            sizes="100vw"
            quality={100}
            className={styles.momentImage}
            draggable={false}
          />
        </NativeReveal>
        <div className={styles.momentSpacer} />
        {/* Remaining 2: side by side duo */}
        <div className={styles.momentDuo}>
          {images.slice(1).map((img, i) => (
            <NativeReveal key={i} behavior="aperture" delay={(i + 1) * 0.12} className={styles.momentItem}>
              <Image
                src={img}
                alt={`${projectTitle} — ${label} ${i + 2}`}
                fill
                sizes="(max-width: 768px) 50vw, 45vw"
                quality={100}
                className={styles.momentImage}
                draggable={false}
              />
            </NativeReveal>
          ))}
        </div>
      </div>
    );
  }

  // 4 images → feature left + trio right arrangement
  if (count === 4) {
    return (
      <div className={styles.imageMoments}>
        {/* First: wide banner */}
        <NativeReveal behavior="aperture" className={`${styles.momentItem} ${styles.momentWide}`}>
          <Image
            src={images[0]!}
            alt={`${projectTitle} — ${label} 1`}
            fill
            sizes="100vw"
            quality={100}
            className={styles.momentImage}
            draggable={false}
          />
        </NativeReveal>
        <div className={styles.momentSpacer} />
        {/* Feature + aside for remaining 3 */}
        <div className={styles.momentFeature}>
          <NativeReveal behavior="aperture" delay={0.1} className={`${styles.momentItem} ${styles.momentItemPrimary}`}>
            <Image
              src={images[1]!}
              alt={`${projectTitle} — ${label} 2`}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              quality={100}
              className={styles.momentImage}
              draggable={false}
            />
          </NativeReveal>
          <NativeReveal behavior="aperture" delay={0.22} className={`${styles.momentItem} ${styles.momentItemSecondary}`}>
            <Image
              src={images[2]!}
              alt={`${projectTitle} — ${label} 3`}
              fill
              sizes="(max-width: 768px) 100vw, 30vw"
              quality={100}
              className={styles.momentImage}
              draggable={false}
            />
          </NativeReveal>
        </div>
      </div>
    );
  }

  // 5+ images → wide banner + trio + remaining duo
  const first = images[0]!;
  const trioImages = images.slice(1, 4);
  const rest = images.slice(4);

  return (
    <div className={styles.imageMoments}>
      {/* Wide opener */}
      <NativeReveal behavior="aperture" className={`${styles.momentItem} ${styles.momentWide}`}>
        <Image
          src={first}
          alt={`${projectTitle} — ${label} 1`}
          fill
          sizes="100vw"
          quality={100}
          className={styles.momentImage}
          draggable={false}
        />
      </NativeReveal>
      <div className={styles.momentSpacer} />
      {/* Trio composition */}
      <div className={styles.momentTrio}>
        {trioImages.map((img, i) => (
          <NativeReveal key={i} behavior="aperture" delay={i * 0.1} className={styles.momentItem}>
            <Image
              src={img}
              alt={`${projectTitle} — ${label} ${i + 2}`}
              fill
              sizes="(max-width: 768px) 100vw, 30vw"
              quality={100}
              className={styles.momentImage}
              draggable={false}
            />
          </NativeReveal>
        ))}
      </div>
      {/* Extra images if any */}
      {rest.length > 0 && (
        <>
          <div className={styles.momentSpacer} />
          <div className={styles.momentDuo}>
            {rest.map((img, i) => (
              <NativeReveal key={i} behavior="aperture" delay={i * 0.12} className={styles.momentItem}>
                <Image
                  src={img}
                  alt={`${projectTitle} — ${label} ${i + 5}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 45vw"
                  quality={100}
                  className={styles.momentImage}
                  draggable={false}
                />
              </NativeReveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default async function ProjectCaseStudyPage({ params }: Props) {
  const resolvedParams = await params;
  const project = projects.find((p) => p.slug === resolvedParams.slug);

  if (!project) notFound();

  // Content-performance tracking (Marketing Studio analytics) —
  // entityId is the static portfolio project's slug, not a Prisma
  // Project.id: this is the public marketing catalog from
  // packages/ui-components, a distinct concept from the Client Portal's
  // database-backed Project model. Fire-and-forget, never blocks render.
  recordPageView({ path: `/projects/${project.slug}`, entityType: 'Project', entityId: project.slug });

  const [offices, siteUrl] = await Promise.all([getActiveOfficesForDisplay(), getSiteUrl()]);
  const msg = `Hi AHW Architects, I'd like to discuss a project like "${project.title}".`;
  // One WhatsApp CTA per office that has a number — however many offices
  // exist, not a fixed Egypt/Kuwait pair.
  const whatsappOffices = offices
    .filter((o) => o.contact.whatsapp)
    .map((o) => ({ id: o.id, displayName: o.displayName, href: buildWhatsAppLink(o.contact.whatsapp!, msg) }));

  // Navigation — walks the same explicit, curated order as the Projects
  // index (data/projectOrder.ts), not raw array position in projects.ts.
  const orderedProjects = sortByDisplayOrder(projects);
  const orderedIndex = orderedProjects.findIndex((p) => p.slug === project.slug);
  const prevProject = orderedIndex > 0 ? orderedProjects[orderedIndex - 1] : null;
  const nextProject = orderedIndex < orderedProjects.length - 1 ? orderedProjects[orderedIndex + 1] : null;

  // Links up to the project's sector (and, for Retail/Workplace/
  // Hospitality, the Commercial parent too) — the real taxonomy
  // hierarchy, not just a flat Home > Projects > Title trail.
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    ...(isCommercialSector(project.sector) ? [{ label: 'Commercial', href: '/projects?sector=commercial' }] : []),
    { label: project.sector, href: `/projects?sector=${project.sector.toLowerCase()}` },
    { label: project.title },
  ];

  const asSeenInPublications = publications.filter((p) => p.relatedProjectSlugs?.includes(project.slug));
  const asSeenInNews = newsItems.filter((n) => n.relatedProjectSlugs?.includes(project.slug));
  const hasPressMentions = asSeenInPublications.length > 0 || asSeenInNews.length > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.caseStudy
      ? project.caseStudy.brief.definitionalSentence
      : `${project.title} — a ${project.sector} project by AHW Architects in ${project.city}.`,
    image: project.ogImage,
    url: `${siteUrl}/projects/${project.slug}`,
    dateCreated: project.year,
    locationCreated: {
      '@type': 'Place',
      name: project.city,
      address: { '@type': 'PostalAddress', addressLocality: project.city, addressCountry: project.market },
    },
    about: project.sector,
    // Reference by @id (the same Organization node every other page's
    // JSON-LD anchors to — see layout.tsx) rather than re-describing AHW
    // Architects as a fresh, disconnected ProfessionalService on every
    // single project page — the standard JSON-LD graph-linking pattern.
    creator: { '@id': `${siteUrl}/#organization` },
  };

  // Minimal page — no case study data yet
  if (!project.caseStudy) {
    return (
      <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <ProjectFilterBar resultCount={projects.length} />
        <div className={styles.datum} />

        {/* Hero */}
        <section className={styles.hero}>
          {project.heroImage && (
            <NativeReveal behavior="aperture" className={styles.heroImageWrapper}>
              <HeroSlider
                images={[project.heroImage].filter(Boolean) as string[]}
                alt={`${project.title}, ${project.sector}, ${project.city} — designed and built by AHW Architects`}
                lightbox
              />
            </NativeReveal>
          )}
          <div className={styles.heroContent}>
            <Breadcrumbs items={breadcrumbs} variant="onDark" />
            <NativeReveal behavior="wipe" as="h1" className={styles.heroTitle}>{project.title}</NativeReveal>
            <NativeReveal behavior="fade" delay={0.2} className={styles.heroData}>
              <span className={styles.dataItem}>{project.sector}</span>
              <span className={styles.dataItem}>{project.city}</span>
              {project.area !== 'Unknown' && <span className={styles.dataItem}>{project.area} m²</span>}
              <span className={styles.dataItem}>{project.year}</span>
              <span className={styles.dataItem}>Scope: {(project.services ?? []).join(', ')}</span>
            </NativeReveal>
          </div>
        </section>

        {/* Brief placeholder */}
        <section className={styles.brief}>
          <div className={styles.gridContainer}>
            <div className={styles.labelCol}>
              <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>THE BRIEF</NativeReveal>
              <span className={styles.hairlineRule} />
            </div>
            <div className={styles.contentCol}>
              <p className={styles.narrative}>Portfolio detail currently in preparation.</p>
            </div>
          </div>
        </section>

        <section className={styles.closing}>
          <div className={styles.surveyMark} />
          <h2 className={styles.closingCopy}>Your project belongs on this page.</h2>
          <Link href="/contact" className={styles.primaryAction}>Start a conversation →</Link>
          {whatsappOffices.map((office) => (
            <Link key={office.id} href={office.href} target="_blank" rel="noopener noreferrer" className={styles.secondaryAction}>
              Chat on WhatsApp ({office.displayName}) →
            </Link>
          ))}
          <Link href="/documents/ahw-company-profile.pdf" target="_blank" className={styles.secondaryAction}>Download company profile (PDF)</Link>
        </section>
      </main>
    );
  }

  const cs = project.caseStudy;

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <ProjectFilterBar resultCount={projects.length} />
      <div className={styles.datum} />

      {/* ── 1. HERO ── */}
      <section className={styles.hero}>
        {project.heroImage && (
          <NativeReveal behavior="aperture" className={styles.heroImageWrapper}>
            <HeroSlider
              images={Array.from(new Set([
                project.heroImage,
                ...(project.caseStudy?.design?.images || []),
                ...(project.caseStudy?.build?.images || []),
                ...(project.caseStudy?.result?.images || [])
              ])).filter(Boolean)}
              alt={`${project.title}, ${project.sector}, ${project.city} — designed and built by AHW Architects`}
              lightbox
            />
          </NativeReveal>
        )}
        <div className={styles.heroContent}>
          <Breadcrumbs items={breadcrumbs} variant="onDark" />
          <NativeReveal behavior="wipe" as="h1" className={styles.heroTitle}>{project.title}</NativeReveal>
          {cs.narrative?.heroHeadline && (
            <NativeReveal behavior="fade" delay={0.15} as="p" className={styles.heroHeadline}>
              {cs.narrative.heroHeadline}
            </NativeReveal>
          )}
          <NativeReveal behavior="fade" delay={0.2} className={styles.heroData}>
            <span className={styles.dataItem}>{project.sector}</span>
            <span className={styles.dataItem}>{project.city}</span>
            {project.area !== 'Unknown' && <span className={styles.dataItem}>{project.area} m²</span>}
            <span className={styles.dataItem}>{project.year}</span>
            <span className={styles.dataItem}>Scope: {(project.services ?? []).join(', ')}</span>
          </NativeReveal>
          {cs.narrative?.heroSubtitle && (
            <NativeReveal behavior="fade" delay={0.3} as="p" className={styles.heroSubtitle}>
              {cs.narrative.heroSubtitle}
            </NativeReveal>
          )}
        </div>
      </section>

      {/* ── 2. THE BRIEF ── */}
      <section className={styles.brief}>
        <div className={styles.gridContainer}>
          <div className={styles.labelCol}>
            <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>The Brief</NativeReveal>
            <span className={styles.hairlineRule} />
          </div>
          <div className={styles.contentCol}>
            <NativeReveal behavior="wipe" as="p" className={styles.definitionalSentence}>
              {cs.brief.definitionalSentence}
            </NativeReveal>
            <NativeReveal behavior="fade" delay={0.2} as="p" className={styles.contextParagraph}>
              {cs.brief.clientProblem}
            </NativeReveal>
          </div>
        </div>
      </section>

      {/* ── 2b. THE STORY (optional narrative layer) ── */}
      {cs.narrative?.story && cs.narrative.story.length > 0 && (
        <section className={styles.brief}>
          <div className={styles.gridContainer}>
            <div className={styles.labelCol}>
              <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>The Story</NativeReveal>
              <span className={styles.hairlineRule} />
            </div>
            <div className={styles.contentCol}>
              {cs.narrative.story.map((paragraph, i) => (
                <NativeReveal behavior="fade" delay={i * 0.1} as="p" key={i} className={styles.contextParagraph}>
                  {paragraph}
                </NativeReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. THE DESIGN — text then images ── */}
      <section className={styles.design}>
        <div className={styles.gridContainer}>
          <div className={styles.labelCol}>
            <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>The Design</NativeReveal>
            <span className={styles.hairlineRule} />
          </div>
          <div className={styles.contentCol}>
            <NativeReveal behavior="fade" as="p" className={styles.narrative}>
              {cs.design.keyDecision}
            </NativeReveal>
          </div>
        </div>
      </section>

      {/* Design images — full-bleed moment outside grid */}
      {cs.design.images.length > 0 && (
        <ImageMoments
          images={cs.design.images}
          projectTitle={project.title}
          label="Design"
        />
      )}
      {cs.narrative?.imageStory?.design && (
        <p className={styles.imageCaption}>{cs.narrative.imageStory.design}</p>
      )}

      {/* ── 3b. DESIGN PHILOSOPHY (optional narrative layer) ── */}
      {cs.narrative?.designPhilosophy && (
        <section className={styles.brief}>
          <div className={styles.gridContainer}>
            <div className={styles.labelCol}>
              <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>Design Philosophy</NativeReveal>
              <span className={styles.hairlineRule} />
            </div>
            <div className={styles.contentCol}>
              <NativeReveal behavior="fade" as="p" className={styles.narrative}>
                {cs.narrative.designPhilosophy}
              </NativeReveal>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. THE BUILD ── */}
      <section className={styles.build}>
        <div className={styles.gridContainer}>
          <div className={styles.labelCol}>
            <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>The Build</NativeReveal>
            <span className={styles.hairlineRule} />
          </div>
          <div className={styles.contentCol}>
            <NativeReveal behavior="fade" as="p" className={styles.narrative}>
              {cs.build.challengeResolution}
            </NativeReveal>
          </div>
        </div>
      </section>

      {/* Build images */}
      {cs.build.images.length > 0 && (
        <ImageMoments
          images={cs.build.images}
          projectTitle={project.title}
          label="Build"
        />
      )}
      {cs.narrative?.imageStory?.build && (
        <p className={styles.imageCaption}>{cs.narrative.imageStory.build}</p>
      )}

      {/* ── 5. THE RESULT ── */}
      <section className={styles.result}>
        <div className={styles.gridContainer}>
          <div className={styles.labelCol}>
            <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>The Result</NativeReveal>
            <span className={styles.hairlineRule} />
          </div>
          <div className={styles.contentCol}>
            <ul className={styles.outcomesList}>
              {cs.result.outcomes.map((outcome, i) => (
                <NativeReveal behavior="wipe" as="li" key={i} delay={i * 0.08} className={styles.outcomeItem}>
                  {outcome}
                </NativeReveal>
              ))}
            </ul>

            {cs.result.clientQuote && (
              <NativeReveal behavior="fade" delay={0.2} className={styles.clientQuoteBlock}>
                <p className={styles.quoteMark}>"</p>
                <p className={styles.quoteText}>{cs.result.clientQuote.quote}</p>
                <p className={styles.quoteAuthor}>— {cs.result.clientQuote.author}</p>
              </NativeReveal>
            )}
          </div>
        </div>
      </section>

      {/* Result images */}
      {cs.result.images.length > 0 && (
        <ImageMoments
          images={cs.result.images}
          projectTitle={project.title}
          label="Result"
        />
      )}
      {cs.narrative?.imageStory?.result && (
        <p className={styles.imageCaption}>{cs.narrative.imageStory.result}</p>
      )}

      {/* ── 5b. WHY THIS PROJECT IS DIFFERENT + CLIENT EXPERIENCE (optional) ── */}
      {(cs.narrative?.whyDifferent || (cs.narrative?.clientExperience?.length ?? 0) > 0) && (
        <section className={styles.brief}>
          <div className={styles.gridContainer}>
            <div className={styles.labelCol}>
              <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>Why This Project Is Different</NativeReveal>
              <span className={styles.hairlineRule} />
            </div>
            <div className={styles.contentCol}>
              {cs.narrative?.whyDifferent && (
                <NativeReveal behavior="fade" as="p" className={styles.contextParagraph}>
                  {cs.narrative.whyDifferent}
                </NativeReveal>
              )}
              {cs.narrative?.clientExperience && cs.narrative.clientExperience.length > 0 && (
                <ul className={styles.outcomesList}>
                  {cs.narrative.clientExperience.map((point, i) => (
                    <NativeReveal behavior="wipe" as="li" key={i} delay={i * 0.06} className={styles.outcomeItem}>
                      {point}
                    </NativeReveal>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 5c. FAQ (optional narrative layer) ── */}
      {cs.narrative?.faq && cs.narrative.faq.length > 0 && (
        <>
          <StructuredData data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: cs.narrative.faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }} />
          <section className={styles.brief}>
            <div className={styles.gridContainer}>
              <div className={styles.labelCol}>
                <NativeReveal behavior="wipe" as="span" className={styles.sectionLabel}>Frequently Asked</NativeReveal>
                <span className={styles.hairlineRule} />
              </div>
              <div className={styles.contentCol}>
                {cs.narrative.faq.map((item, i) => (
                  <div key={i} className={styles.faqItem}>
                    <NativeReveal behavior="wipe" as="p" delay={i * 0.05} className={styles.faqQuestion}>
                      {item.question}
                    </NativeReveal>
                    <NativeReveal behavior="fade" as="p" delay={i * 0.05 + 0.05} className={styles.contextParagraph}>
                      {item.answer}
                    </NativeReveal>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── 6. RELATED ── */}
      <section className={styles.relatedSection}>
        <h2 className={styles.relatedHeader}>Continue Exploring</h2>
        <div className={styles.relatedGrid}>
          {cs.relatedProjects.map(slug => {
            const rel = projects.find(p => p.slug === slug);
            if (!rel) return null;
            return (
              <Link key={slug} href={`/projects/${rel.slug}`} className={styles.relatedItem}>
                <span className={styles.relatedTitle}>{rel.title}</span>
                <span className={styles.relatedMeta}>{rel.sector} · {rel.city}</span>
              </Link>
            );
          })}
          <Link href={cs.relatedExpertise.href} className={styles.relatedItem}>
            <span className={styles.relatedTitle}>{cs.relatedExpertise.title}</span>
            <span className={styles.relatedMeta}>Expertise Discipline →</span>
          </Link>
        </div>
      </section>

      {/* ── 6b. AS SEEN IN ── */}
      {hasPressMentions && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedHeader}>As Seen In</h2>
          <div className={styles.relatedGrid}>
            {asSeenInPublications.map((pub) => (
              <Link key={pub.id} href={`/insights/publications/${pub.slug}`} className={styles.relatedItem}>
                <span className={styles.relatedTitle}>{pub.outlet}</span>
                <span className={styles.relatedMeta}>{pub.title}</span>
              </Link>
            ))}
            {asSeenInNews.map((news) => (
              <Link key={news.id} href={`/insights/news/${news.slug}`} className={styles.relatedItem}>
                <span className={styles.relatedTitle}>{news.title}</span>
                <span className={styles.relatedMeta}>Company News →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. PREV / NEXT ── */}
      <section className={styles.navSection}>
        {prevProject ? (
          <Link href={`/projects/${prevProject.slug}`} className={styles.navLink}>
            ← {prevProject.title}
          </Link>
        ) : <span />}

        {nextProject ? (
          <Link href={`/projects/${nextProject.slug}`} className={styles.navLink}>
            {nextProject.title} →
          </Link>
        ) : <span />}
      </section>

      {/* ── 8. CLOSING CTA ── */}
      <section className={styles.closing}>
        <div className={styles.surveyMark} />
        <h2 className={styles.closingCopy}>{cs.narrative?.cta.headline || 'Your project belongs on this page.'}</h2>
        {cs.narrative?.cta.subtext && (
          <p className={styles.ctaSubtext}>
            {cs.narrative.cta.subtext}
          </p>
        )}
        <Link href="/contact" className={styles.primaryAction}>Start a conversation →</Link>
        {whatsappOffices.map((office) => (
          <Link key={office.id} href={office.href} target="_blank" rel="noopener noreferrer" className={styles.secondaryAction}>
            Chat on WhatsApp ({office.displayName}) →
          </Link>
        ))}
        <Link href="/documents/ahw-company-profile.pdf" target="_blank" className={styles.secondaryAction}>
          Download company profile (PDF)
        </Link>
      </section>
    </main>
  );
}
