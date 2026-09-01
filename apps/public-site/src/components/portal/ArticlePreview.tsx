'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import pageStyles from '../../app/insights/news/[slug]/page.module.css';
import { parseTiptapDoc, renderDocBody, renderArticleBody } from '../article/ArticleBodyRenderer';
import styles from './ArticlePreview.module.css';

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

function useLiveHeroImage(initial: string | undefined): string | undefined {
  const [url, setUrl] = useState(initial);
  useEffect(() => {
    const el = document.getElementById('featuredImageId') as HTMLSelectElement | null;
    if (!el) return;
    const onChange = () => {
      const opt = el.options[el.selectedIndex];
      const hero = opt?.getAttribute('data-hero');
      setUrl(hero || undefined);
    };
    el.addEventListener('change', onChange);
    return () => el.removeEventListener('change', onChange);
  }, []);
  return url;
}

function useLiveBody(initial: string): string {
  const [body, setBody] = useState(initial);
  useEffect(() => {
    const onChange = (e: Event) => setBody((e as CustomEvent<string>).detail);
    window.addEventListener('ahw:article-body-change', onChange);
    return () => window.removeEventListener('ahw:article-body-change', onChange);
  }, []);
  return body;
}

export function ArticlePreview({
  initialTitle,
  initialBody,
  fallbackAlt,
  initialCoverImageUrl,
  galleryImages,
}: {
  initialTitle: string;
  initialBody: string;
  fallbackAlt: string;
  initialCoverImageUrl?: string | undefined;
  galleryImages: { id: string; url: string; alt: string }[];
}) {
  const title = useLiveField('title') || initialTitle;
  const body = useLiveBody(initialBody);
  const coverImageUrl = useLiveHeroImage(initialCoverImageUrl);

  const doc = parseTiptapDoc(body);

  return (
    <div className={styles.frame}>
      <div className={pageStyles.main}>
        <div className={pageStyles.article}>
          <header className={pageStyles.header}>
            <div className={pageStyles.container}>
              <h1 className={pageStyles.title}>{title || 'Untitled article'}</h1>
            </div>
          </header>

          {coverImageUrl && (
            <div className={pageStyles.coverImageWrapper}>
              <Image src={coverImageUrl} alt={title} fill sizes="800px" className={pageStyles.coverImage} />
            </div>
          )}

          <div className={pageStyles.container}>
            <div className={pageStyles.contentWrapper}>
              <div className={pageStyles.content}>
                {doc ? renderDocBody(doc, fallbackAlt, pageStyles) : renderArticleBody(body, galleryImages, pageStyles)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
