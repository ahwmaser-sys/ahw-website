'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { useState } from 'react';
import styles from '../../../../components/portal/portal-ui.module.css';

export interface GalleryOption {
  id: string;
  url: string;
  alt: string;
}

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

  const editor = useEditor({
    extensions: [StarterKit, TiptapImage.configure({ inline: false })],
    content: parseInitialContent(initialBody),
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => setJson(JSON.stringify(e.getJSON())),
  });

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
        {galleryOptions.length > 0 && (
          <select
            className={styles.select}
            defaultValue=""
            onChange={(e) => {
              const chosen = galleryOptions.find((g) => g.id === e.target.value);
              if (chosen) editor?.chain().focus().setImage({ src: chosen.url, alt: chosen.alt }).run();
              e.currentTarget.value = '';
            }}
          >
            <option value="" disabled>Insert image from gallery…</option>
            {galleryOptions.map((g) => (
              <option key={g.id} value={g.id}>{g.alt}</option>
            ))}
          </select>
        )}
      </div>
      <EditorContent editor={editor} className={styles.editorContent} />
      {galleryOptions.length === 0 && (
        <p className={styles.hint}>Add photos to the Gallery above first, then come back here to place them in the text.</p>
      )}
    </div>
  );
}
