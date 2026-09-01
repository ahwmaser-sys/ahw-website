'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './SocialPreview.module.css';

interface PreviewImages {
  linkedin: string;
  facebook: string;
  google: string;
}

// Attaches to the existing Title/Excerpt/Featured-image fields by id
// instead of lifting their state up into a shared parent — those fields
// live in two separate forms (EditNewsForm's title/excerpt, and
// FeaturedImageForm's featuredImageId select) that submit independently
// and predate this preview. Reading their live values via DOM listeners
// gives real-time reactivity without restructuring either form.
function useLiveField(id: string): string {
  const [value, setValue] = useState('');
  useEffect(() => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return;
    setValue(el.value);
    const onInput = () => setValue(el.value);
    el.addEventListener('input', onInput);
    return () => el.removeEventListener('input', onInput);
  }, [id]);
  return value;
}

function useLiveFeaturedImage(initial: PreviewImages | undefined): PreviewImages | undefined {
  const [images, setImages] = useState(initial);
  useEffect(() => {
    const el = document.getElementById('featuredImageId') as HTMLSelectElement | null;
    if (!el) return;
    const readFromSelectedOption = () => {
      const opt = el.options[el.selectedIndex];
      if (!opt || !opt.value) {
        setImages(undefined);
        return;
      }
      const linkedin = opt.getAttribute('data-linkedin');
      const facebook = opt.getAttribute('data-facebook');
      const google = opt.getAttribute('data-google');
      if (linkedin && facebook && google) setImages({ linkedin, facebook, google });
    };
    el.addEventListener('change', readFromSelectedOption);
    return () => el.removeEventListener('change', readFromSelectedOption);
  }, []);
  return images;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toUpperCase();
  } catch {
    return url.toUpperCase();
  }
}

export function SocialPreview({
  initialTitle,
  initialExcerpt,
  articleUrl,
  initialImages,
}: {
  initialTitle: string;
  initialExcerpt: string;
  articleUrl: string;
  initialImages?: PreviewImages | undefined;
}) {
  const title = useLiveField('title') || initialTitle;
  const excerpt = useLiveField('excerpt') || initialExcerpt;
  const images = useLiveFeaturedImage(initialImages);
  const domain = domainOf(articleUrl);

  const linkedinCaption = `${title}\n\n${excerpt}\n\n${articleUrl}`;
  const readMoreCaption = `${title}\n\n${excerpt}\n\nRead more: ${articleUrl}`;

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <p className={styles.platformLabel}>LinkedIn</p>
        <div className={styles.linkedinCard}>
          <div className={styles.linkedinHeader}>
            <span className={styles.avatar}>A</span>
            <div>
              <div className={styles.authorName}>AHW Architects</div>
              <div className={styles.metaLine}>Just now · 🌐</div>
            </div>
          </div>
          <p className={styles.captionText}>{linkedinCaption}</p>
          {images ? (
            <div className={styles.linkPreview}>
              <div className={styles.linkImageWrapper}>
                <Image src={images.linkedin} alt={title} fill sizes="400px" className={styles.linkImage} />
              </div>
              <div className={styles.linkFooter}>
                <div className={styles.linkDomain}>{domain}</div>
                <div className={styles.linkTitle}>{title}</div>
              </div>
            </div>
          ) : (
            <p className={styles.noImageHint}>No Featured image selected yet — LinkedIn won&apos;t show a link card without one.</p>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.platformLabel}>Facebook</p>
        <div className={styles.facebookCard}>
          <div className={styles.linkedinHeader}>
            <span className={styles.avatar}>A</span>
            <div>
              <div className={styles.authorName}>AHW Architects</div>
              <div className={styles.metaLine}>Just now · 🌐</div>
            </div>
          </div>
          <p className={styles.captionText}>{readMoreCaption}</p>
          {images ? (
            <div className={styles.linkPreview}>
              <div className={styles.linkImageWrapper}>
                <Image src={images.facebook} alt={title} fill sizes="400px" className={styles.linkImage} />
              </div>
              <div className={styles.linkFooter}>
                <div className={styles.linkDomain}>{domain}</div>
                <div className={styles.linkTitle}>{title}</div>
                <div className={styles.linkDescription}>{excerpt}</div>
              </div>
            </div>
          ) : (
            <p className={styles.noImageHint}>No Featured image selected yet — Facebook won&apos;t show a link card without one.</p>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.platformLabel}>Google Business Profile</p>
        <div className={styles.googleCard}>
          <div className={styles.linkedinHeader}>
            <span className={styles.avatarGoogle}>G</span>
            <div>
              <div className={styles.authorName}>AHW Architects</div>
              <div className={styles.metaLine}>Just now</div>
            </div>
          </div>
          {images ? (
            <div className={styles.googleImageWrapper}>
              <Image src={images.google} alt={title} fill sizes="400px" className={styles.linkImage} />
            </div>
          ) : (
            <p className={styles.noImageHint}>No Featured image selected yet.</p>
          )}
          <p className={styles.captionText}>{readMoreCaption}</p>
        </div>
      </div>
    </div>
  );
}
