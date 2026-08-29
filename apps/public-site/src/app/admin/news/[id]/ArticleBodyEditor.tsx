'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { useState } from 'react';
import styles from '../../../../components/portal/portal-ui.module.css';

export interface GalleryOption {
  id: string;
  alt: string;
  squareUrl: string;
  bannerUrl: string;
}

type Placement = 'left' | 'right' | 'banner';

const PLACEMENT_OPTIONS: { value: Placement; label: string }[] = [
  { value: 'left', label: 'Float left' },
  { value: 'right', label: 'Float right' },
  { value: 'banner', label: 'Full-width banner' },
];

// Adds a "display" attribute (left / right / banner) on top of the
// stock Image node, round-tripping through getJSON()/setContent() like
// any other attribute — the public article page reads it to decide
// whether to float the image beside text or render it full-width. Not
// exposed by the stock setImage command (its options are fixed to
// src/alt/title), so images are inserted via insertContent() instead,
// which accepts any attrs this extended schema defines.
const ArticleImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      display: {
        default: 'left',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-display') || 'left',
        renderHTML: (attributes: { display?: string }) => ({ 'data-display': attributes.display }),
      },
    };
  },
});

// Every article published before this editor existed has its body
// stored as plain text — blank line between paragraphs, a short
// ALL-CAPS line for a subheading (see the public article page's own
// fallback parser). Converts that into a starting TipTap document so
// opening an old article for editing shows real, already-structured
// content instead of one unformatted block, and re-saving it upgrades
// it to the new format automatically.
function isHeadingLine(block: string): boolean {
  return !block.includes('\n') && block.length <= 100 && /[A-Za-z]/.test(block) && block === block.toUpperCase();
}

function plainTextToDoc(text: string) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 0) {
    // A ProseMirror doc needs at least one block — an empty content
    // array (a brand-new article with no body yet) fails schema
    // validation otherwise.
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }
  return {
    type: 'doc',
    content: blocks.map((block) =>
      isHeadingLine(block)
        ? { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: block }] }
        : { type: 'paragraph', content: [{ type: 'text', text: block }] },
    ),
  };
}

function parseInitialContent(raw: string) {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed as { type?: string }).type === 'doc') {
      return parsed;
    }
  } catch {
    // Not JSON — a pre-existing plain-text body, handled below.
  }
  return plainTextToDoc(raw);
}

export function ArticleBodyEditor({ initialBody, galleryOptions }: { initialBody: string; galleryOptions: GalleryOption[] }) {
  const [json, setJson] = useState(() => JSON.stringify(parseInitialContent(initialBody)));
  const [selectedImageId, setSelectedImageId] = useState('');
  const [placement, setPlacement] = useState<Placement>('left');

  const editor = useEditor({
    extensions: [StarterKit, ArticleImage.configure({ inline: false })],
    content: parseInitialContent(initialBody),
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => setJson(JSON.stringify(e.getJSON())),
  });

  const insertSelectedImage = () => {
    const chosen = galleryOptions.find((g) => g.id === selectedImageId);
    if (!chosen || !editor) return;
    const src = placement === 'banner' ? chosen.bannerUrl : chosen.squareUrl;
    editor.chain().focus().insertContent({ type: 'image', attrs: { src, alt: chosen.alt, display: placement } }).run();
    setSelectedImageId('');
  };

  return (
    <div>
      <input type="hidden" name="body" value={json} readOnly />
      <div className={styles.editorToolbar}>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive('bold') ? styles.toolbarButtonActive : styles.toolbarButton}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={editor?.isActive('italic') ? styles.toolbarButtonActive : styles.toolbarButton}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor?.isActive('heading', { level: 2 }) ? styles.toolbarButtonActive : styles.toolbarButton}
        >
          Heading
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={editor?.isActive('bulletList') ? styles.toolbarButtonActive : styles.toolbarButton}
        >
          List
        </button>
      </div>
      {galleryOptions.length > 0 && (
        <div className={styles.editorToolbar}>
          <select className={styles.select} value={selectedImageId} onChange={(e) => setSelectedImageId(e.target.value)}>
            <option value="" disabled>Choose a gallery photo…</option>
            {galleryOptions.map((g) => (
              <option key={g.id} value={g.id}>{g.alt}</option>
            ))}
          </select>
          <select className={styles.select} value={placement} onChange={(e) => setPlacement(e.target.value as Placement)}>
            {PLACEMENT_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button type="button" onClick={insertSelectedImage} disabled={!selectedImageId} className={styles.toolbarButton}>
            Insert at cursor
          </button>
        </div>
      )}
      <EditorContent editor={editor} className={styles.editorContent} />
      {galleryOptions.length === 0 && (
        <p className={styles.hint}>Add photos to the Gallery above first, then come back here to place them in the text.</p>
      )}
    </div>
  );
}
