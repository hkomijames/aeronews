"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: {}, 
        link: false, // Disabling built-in link logic to silence duplicate warnings
        // Ensure hardBreak handles Shift+Enter newlines correctly
        hardBreak: {},
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-400 underline cursor-pointer' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-xl max-h-[400px] object-cover mt-6 mx-auto shadow-md' },
      }),
      Youtube.configure({
        HTMLAttributes: { class: 'w-full aspect-video rounded-xl my-6 shadow-md' },
      }),
    ],
    content: content,
    immediatelyRender: false, 
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML()); 
    },
    editorProps: {
      attributes: {
        // ─── FIX: Added prose-p:my-4, prose-p:min-h-[1.5rem], and prose-br:before:content-none ───
        class: 'prose prose-invert max-w-none min-h-[350px] bg-slate-950 border border-slate-800 rounded-b-xl p-4 focus:outline-none focus:border-slate-700 text-slate-200 overflow-y-auto prose-p:my-4 prose-p:min-h-[1.5rem] prose-br:before:content-none prose-video:w-full prose-video:aspect-video prose-video:rounded-xl prose-video:my-6 prose-video:shadow-md prose-video:bg-black prose-figure:my-6 prose-figure:text-center prose-img:rounded-xl prose-img:max-h-[400px] prose-img:object-cover prose-img:mx-auto prose-img:shadow-md prose-figcaption:text-xs prose-figcaption:text-slate-400 prose-figcaption:mt-2 prose-figcaption:italic prose-figcaption:font-sans',
        spellcheck: 'true',
      },
    },
  });

  if (!editor) return null;

  // Toolbar Actions
  const addLink = () => {
    const url = window.prompt('Enter Hyperlink URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImageLocally = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/media', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
          const altText = window.prompt('Enter Image Alt Text (Crucial for Google Bots SEO):');
          if (altText === null) return; 

          const caption = window.prompt('Enter Image Caption Text (Optional - Displays underneath image):');
          const validatedAlt = altText.trim() || 'News illustration graphic';
          
          if (caption && caption.trim()) {
            const figureHtml = `
              <figure class="my-6 text-center">
                <img src="${data.url}" alt="${validatedAlt}" class="rounded-xl max-h-[400px] object-cover mx-auto shadow-md" />
                <figcaption class="text-xs text-slate-400 mt-2 font-sans">
                  <i>${caption.trim()}</i>
                </figcaption>
              </figure>
            `;
            editor.chain().focus().insertContent(figureHtml).run();
          } else {
            editor.chain().focus().setImage({ src: data.url, alt: validatedAlt }).run();
          }
        } else {
          alert('Failed to upload image.');
        }
      } catch (err) {
        alert('Network error uploading image.');
      }
    };
    input.click();
  };

  const addVideoLocally = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/media', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          editor.chain().focus().insertContent(`<video src="${data.url}" controls class="w-full rounded-xl my-6 shadow-md bg-black"></video><p></p>`).run();
        } else {
          alert('Failed to upload video.');
        }
      } catch (err) {
        alert('Network error uploading video.');
      }
    };
    input.click();
  };

  return (
    <div className="w-full flex flex-col">
      {/* Editor Control Toolbar bar */}
      <div className="flex flex-wrap gap-1.5 bg-slate-900 border border-slate-800 p-2 rounded-t-xl border-b-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2.5 py-1 text-xs italic rounded ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          “ Quote
        </button>
        
        <div className="w-px bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={addLink}
          className={`px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 ${editor.isActive('link') ? 'text-blue-400' : ''}`}
        >
          🔗 Link
        </button>
        <button
          type="button"
          onClick={addImageLocally}
          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200"
        >
          🖼️ Image
        </button>
        <button
          type="button"
          onClick={addVideoLocally}
          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200"
        >
          📺 Video
        </button>
      </div>

      {/* Primary Editable Canvas space */}
      <EditorContent editor={editor} />
    </div>
  );
}
