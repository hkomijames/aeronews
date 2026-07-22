"use client";

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Node } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { upload } from '@vercel/blob/client';

// Define a Custom Tiptap Node Extension for Native HTML5 Videos
const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      class: { default: 'w-full rounded-xl my-6 shadow-md bg-black' },
    };
  },
  parseHTML() { return [{ tag: 'video[src]' }]; },
  renderHTML({ HTMLAttributes }) { return ['video', HTMLAttributes]; },
});

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  isSaved?: boolean;
}

export default function RichTextEditor({ content, onChange, isSaved = false }: EditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadedUrlsRef = useRef<string[]>([]);
  const isSavedRef = useRef(isSaved);

  useEffect(() => {
    isSavedRef.current = isSaved;
  }, [isSaved]);

  // Unmount session fallback cleanup handler
  useEffect(() => {
    return () => {
      if (isSavedRef.current) return;
      const temporaryAssets = [...uploadedUrlsRef.current];
      if (temporaryAssets.length === 0) return;

      temporaryAssets.forEach((url) => {
        fetch('/api/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          keepalive: true,
        }).catch((err) => console.error("Session cleanup failure:", err));
      });
    };
  }, []);

  // Separate trigger helper to safely hit the endpoint and filter state
  const deleteBlobFromCloud = async (url: string) => {
    try {
      await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      uploadedUrlsRef.current = uploadedUrlsRef.current.filter((item) => item !== url);
    } catch (err) {
      console.error("Failed to execute live asset deletion callback:", err);
    }
  };
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ blockquote: {}, link: false, hardBreak: {} }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-400 underline cursor-pointer' } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-xl max-h-[400px] object-cover mt-6 mx-auto shadow-md' } }),
      Youtube.configure({ HTMLAttributes: { class: 'w-full aspect-video rounded-xl my-6 shadow-md' } }),
      VideoExtension,
    ],
    content: content,
    immediatelyRender: false, 
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[350px] bg-slate-950 border border-slate-800 rounded-b-xl p-4 focus:outline-none focus:border-slate-700 text-slate-200 overflow-y-auto prose-p:my-4 prose-p:min-h-[1.5rem] prose-br:before:content-none prose-video:w-full prose-video:aspect-video prose-video:rounded-xl prose-video:my-6 prose-video:shadow-md prose-video:bg-black prose-figure:my-6 prose-figure:text-center prose-img:rounded-xl prose-img:max-h-[400px] prose-img:object-cover prose-img:mx-auto prose-img:shadow-md prose-figcaption:text-xs prose-figcaption:text-slate-400 prose-figcaption:mt-2 prose-figcaption:italic prose-figcaption:font-sans',
        spellcheck: 'true',
      },
      // MONITOR BACKSPACE & DELETE KEYS FOR LIVE CLOUD DELETIONS
            // MONITOR BACKSPACE & DELETE KEYS FOR LIVE CLOUD DELETIONS
      handleKeyDown(view, event) {
        if (event.key === 'Backspace' || event.key === 'Delete') {
          const { state } = view;
          const { selection } = state;
          
          // 1. Explicitly check if the selection is an actual Tiptap NodeSelection type
          if (selection instanceof Object && 'node' in selection && selection.node) {
            // Safely cast to access Tiptap schema properties without typing compilation breaks
            const selectedNode = (selection as any).node;
            const nodeType = selectedNode.type?.name;
            let targetUrl = '';

            if ((nodeType === 'image' || nodeType === 'video') && selectedNode.attrs) {
              targetUrl = selectedNode.attrs.src;
            }

            if (targetUrl) {
              deleteBlobFromCloud(targetUrl);
            }
          } 
          // 2. Text cursor selection check (When user hits backspace standing adjacent to custom blocks)
          else {
            const pos = event.key === 'Backspace' ? selection.$from.before() : selection.$from.after();
            try {
              const nodeAdjacent = state.doc.nodeAt(pos);
              if (nodeAdjacent && nodeAdjacent.type && nodeAdjacent.attrs) {
                const type = nodeAdjacent.type.name;
                if ((type === 'image' || type === 'video') && nodeAdjacent.attrs.src) {
                  deleteBlobFromCloud(nodeAdjacent.attrs.src);
                }
              }
            } catch (e) {
              // Ignore out-of-bounds selection blocks
            }
          }
        }
        return false;
      }

    },
  });

  if (!editor) return null;

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

      try {
        const altText = window.prompt('Enter Image Alt Text (SEO):');
        if (altText === null) return; 

        const caption = window.prompt('Enter Image Caption Text (Optional):');
        const validatedAlt = altText.trim() || 'News illustration graphic';

        setIsUploading(true);
        setUploadProgress(15);

        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/media',
        });

        if (newBlob.url) {
          uploadedUrlsRef.current.push(newBlob.url);
          setUploadProgress(100);

          if (caption && caption.trim()) {
            const figureHtml = `
              <figure class="my-6 text-center">
                <img src="${newBlob.url}" alt="${validatedAlt}" class="rounded-xl max-h-100 object-cover mx-auto shadow-md" />
                <figcaption class="text-xs text-slate-400 mt-2 font-sans">
                  <i>${caption.trim()}</i>
                </figcaption>
              </figure>
            `;
            editor.chain().focus().insertContent(figureHtml).run();
          } else {
            editor.chain().focus().setImage({ src: newBlob.url, alt: validatedAlt }).run();
          }
        }
      } catch (err) {
        alert('Network error uploading image.');
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 600);
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

      try {
        setIsUploading(true);
        setUploadProgress(5);

        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/media',
          onUploadProgress: (progressEvent) => {
            setUploadProgress(progressEvent.percentage);
          }
        });

        if (newBlob.url) {
          uploadedUrlsRef.current.push(newBlob.url);
          
          editor
            .chain()
            .focus()
            .insertContent({ type: 'video', attrs: { src: newBlob.url } })
            .insertContent({ type: 'paragraph' })
            .run();
        }
      } catch (err) {
        alert('Error uploading large video asset.');
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 800);
      }
    };
    input.click();
  };

  return (
    <div className="w-full flex flex-col relative">
      <div className="flex flex-wrap gap-1.5 bg-slate-900 border border-slate-800 p-2 rounded-t-xl border-b-0 relative">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          B
        </button>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2.5 py-1 text-xs italic rounded ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          I
        </button>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          H2
        </button>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          H3
        </button>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          “ Quote
        </button>
        
        <div className="w-px bg-slate-800 mx-1" />

        <button
          type="button"
          disabled={isUploading}
          onClick={addLink}
          className={`px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 ${editor.isActive('link') ? 'text-blue-400' : ''}`}
        >
          🔗 Link
        </button>
        <button
          type="button"
          disabled={isUploading}
          onClick={addImageLocally}
          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          {isUploading ? '⌛ Processing...' : '🖼️ Image'}
        </button>
        <button
          type="button"
          disabled={isUploading}
          onClick={addVideoLocally}
          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          {isUploading ? '⌛ Processing...' : '📺 Video'}
        </button>

        {isUploading && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
        )}
      </div>

      <div className={isUploading ? "pointer-events-none opacity-80" : ""}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
