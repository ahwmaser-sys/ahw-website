import { Fragment, type ReactNode } from 'react';
import Image from 'next/image';
import { ScrollReveal } from '@agp/ui-components';

// Extracted verbatim from the public article page
// (app/insights/news/[slug]/page.tsx) so the admin editor's live preview
// renders the article body with the exact same logic the real published
// page uses — not a re-implementation that could quietly drift out of
// sync with it. The public page imports these from here instead of
// defining them inline.

function isHeadingLine(block: string): boolean {
  return !block.includes('\n') && block.length <= 100 && /[A-Za-z]/.test(block) && block === block.toUpperCase();
}

const GALLERY_INSERT_INTERVAL = 2;

export function renderArticleBody(
  content: string,
  galleryImages: { id: string; url: string; alt: string }[],
  styles: Record<string, string>,
) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const galleryElement = (image: { id: string; url: string; alt: string }, index: number) => {
    const isLeft = index % 2 === 0;
    return (
      <div key={`gallery-${image.id}`} className={isLeft ? styles.galleryFloatLeft : styles.galleryFloatRight}>
        <ScrollReveal direction={isLeft ? 'left' : 'right'}>
          <div className={styles.galleryImageWrapper}>
            <Image src={image.url} alt={image.alt} fill sizes="(max-width: 640px) 100vw, 340px" className={styles.galleryImage} loading="lazy" />
          </div>
        </ScrollReveal>
      </div>
    );
  };

  const elements: ReactNode[] = [];
  let paragraphCount = 0;
  let galleryIndex = 0;

  blocks.forEach((block, i) => {
    if (isHeadingLine(block)) {
      elements.push(
        <ScrollReveal key={`heading-${i}`} direction="up">
          <h2 className={styles.sectionHeading}>{block}</h2>
        </ScrollReveal>,
      );
      return;
    }

    elements.push(
      <ScrollReveal key={`para-${i}`} direction="up">
        <p className={styles.textContent}>{block}</p>
      </ScrollReveal>,
    );
    paragraphCount += 1;

    const nextImage = galleryImages[galleryIndex];
    if (nextImage && paragraphCount % GALLERY_INSERT_INTERVAL === 0) {
      elements.push(galleryElement(nextImage, galleryIndex));
      galleryIndex += 1;
    }
  });

  let remainingImage = galleryImages[galleryIndex];
  while (remainingImage) {
    elements.push(galleryElement(remainingImage, galleryIndex));
    galleryIndex += 1;
    remainingImage = galleryImages[galleryIndex];
  }

  return elements;
}

export interface TiptapMark {
  type: string;
}
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export function parseTiptapDoc(raw: string): TiptapNode | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed as TiptapNode).type === 'doc') {
      return parsed as TiptapNode;
    }
  } catch {
    // Not JSON — a legacy plain-text body, handled by renderArticleBody.
  }
  return null;
}

export function renderInlineNode(node: TiptapNode, key: number): ReactNode {
  if (node.type !== 'text' || !node.text) return null;
  let content: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') content = <strong>{content}</strong>;
    else if (mark.type === 'italic') content = <em>{content}</em>;
    else if (mark.type === 'strike') content = <s>{content}</s>;
    else if (mark.type === 'code') content = <code>{content}</code>;
  }
  return <Fragment key={key}>{content}</Fragment>;
}

export function renderDocBody(doc: TiptapNode, fallbackAlt: string, styles: Record<string, string>) {
  const elements: ReactNode[] = [];
  let imageIndex = 0;

  (doc.content ?? []).forEach((node, i) => {
    if (node.type === 'heading') {
      const text = (node.content ?? []).map((c) => c.text ?? '').join('');
      if (!text.trim()) return;
      elements.push(
        <ScrollReveal key={`heading-${i}`} direction="up">
          <h2 className={styles.sectionHeading}>{(node.content ?? []).map((c, ci) => renderInlineNode(c, ci))}</h2>
        </ScrollReveal>,
      );
    } else if (node.type === 'paragraph') {
      if (!node.content || node.content.length === 0) return;
      elements.push(
        <ScrollReveal key={`para-${i}`} direction="up">
          <p className={styles.textContent}>{node.content.map((c, ci) => renderInlineNode(c, ci))}</p>
        </ScrollReveal>,
      );
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      const ListTag = node.type === 'bulletList' ? 'ul' : 'ol';
      elements.push(
        <ScrollReveal key={`list-${i}`} direction="up">
          <ListTag className={styles.articleList}>
            {(node.content ?? []).map((item, itemIndex) => (
              <li key={itemIndex}>
                {(item.content ?? []).flatMap((p) => p.content ?? []).map((c, ci) => renderInlineNode(c, ci))}
              </li>
            ))}
          </ListTag>
        </ScrollReveal>,
      );
    } else if (node.type === 'image') {
      const src = node.attrs?.src;
      if (typeof src !== 'string' || !src) return;
      const alt = typeof node.attrs?.alt === 'string' && node.attrs.alt ? node.attrs.alt : fallbackAlt;
      const display = node.attrs?.display;

      if (display === 'banner') {
        elements.push(
          <ScrollReveal key={`image-${i}`} direction="up">
            <div className={styles.inlineBannerWrapper}>
              <Image src={src} alt={alt} fill sizes="800px" className={styles.coverImage} loading="lazy" />
            </div>
          </ScrollReveal>,
        );
        return;
      }

      const isLeft = display === 'left' || (display !== 'right' && imageIndex % 2 === 0);
      imageIndex += 1;
      elements.push(
        <div key={`image-${i}`} className={isLeft ? styles.galleryFloatLeft : styles.galleryFloatRight}>
          <ScrollReveal direction={isLeft ? 'left' : 'right'}>
            <div className={styles.galleryImageWrapper}>
              <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 340px" className={styles.galleryImage} loading="lazy" />
            </div>
          </ScrollReveal>
        </div>,
      );
    }
  });

  return elements;
}
