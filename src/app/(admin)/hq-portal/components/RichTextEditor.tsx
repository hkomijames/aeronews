"use client";

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { upload } from '@vercel/blob/client';

// Streamlined video node extension to handle HTML5 Video parsing safely
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
      class: { default: 'w-full aspect-video rounded-xl my-6 shadow-md bg-black' },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      { class: 'w-full block clear-both', contenteditable: 'false' }, 
      ['video', mergeAttributes(HTMLAttributes, { preload: 'metadata', controls: 'true' })]
    ];
  },
  // Custom addCommands block removed to prevent ChainedCommands TypeScript errors completely
});

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  isSaved?: boolean;
}

export default function RichTextEditor({ content, onChange, isSaved = false }: EditorProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadedUrlsRef = useRef<string[]>([]);
  const isSavedRef = useRef(isSaved);

  useEffect(() => {
    isSavedRef.current = isSaved;
  }, [isSaved]);

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
        class: 'prose prose-invert max-w-none min-h-[350px] bg-slate-950 border border-slate-800 rounded-b-xl p-4 focus:outline-none focus:border-slate-700 text-slate-200 overflow-y-auto prose-p:my-4 prose-p:min-h-[1.5rem] prose-br:before:content-none prose-figure:my-6 prose-figure:text-center prose-img:rounded-xl prose-img:max-h-[400px] prose-img:object-cover prose-img:mx-auto prose-img:shadow-md prose-figcaption:text-xs prose-figcaption:text-slate-400 prose-figcaption:mt-2 prose-figcaption:italic prose-figcaption:font-sans',
        spellcheck: 'true',
      },
      handleKeyDown(view, event) {
  if (event.key === 'Backspace' || event.key === 'Delete') {
    const { state } = view;
    const { selection } = state;
    let targetUrl = '';

    // Scenario 1: The user has actively clicked/selected the block node
    if (selection instanceof Object && 'node' in selection && selection.node) {
      const selectedNode = (selection as any).node;
      const nodeType = selectedNode.type?.name;

      if (nodeType === 'image' && selectedNode.attrs) {
        targetUrl = selectedNode.attrs.src;
      } else if (nodeType === 'video' && selectedNode.attrs) {
        targetUrl = selectedNode.attrs.src;
      }
    } 
    // Scenario 2: Inline cursor backspace (the cursor is right next to the video block)
    else {
      const pos = event.key === 'Backspace' ? selection.$from.before() : selection.$from.after();
      try {
        const nodeAdjacent = state.doc.nodeAt(pos);
        if (nodeAdjacent) {
          const type = nodeAdjacent.type.name;
          
          if (type === 'image' && nodeAdjacent.attrs?.src) {
            targetUrl = nodeAdjacent.attrs.src;
          } 
          // FALLBACK FOR RAW HTML: Inspect the raw DOM node structure directly if Tiptap attributes are missing
          else if (type === 'video') {
            if (nodeAdjacent.attrs?.src) {
              targetUrl = nodeAdjacent.attrs.src;
            } else {
              // Extract the source directly from the underlying DOM element properties
              const domNode = view.nodeDOM(pos) as HTMLElement;
              const videoEl = domNode?.querySelector('video');
              if (videoEl?.src) {
                targetUrl = videoEl.src;
              }
            }
          }
        }
      } catch (e) {
        // Ignore out-of-bounds selection blocks quietly
      }
    }

    // Trigger the cloud deletion endpoint if a valid asset URL was identified
    if (targetUrl) {
      deleteBlobFromCloud(targetUrl);
    }
  }
  return false; // Let Tiptap finish handling the actual text/node removal from the UI
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
      const files = input.files;
      if (!files || files.length === 0) return;
      const file = files[0];

      try {
        const altText = window.prompt('Enter Image Alt Text (SEO):');
        if (altText === null) return; 

        const caption = window.prompt('Enter Image Caption Text (Optional):');
        const validatedAlt = altText.trim() || 'News illustration graphic';

        setImageLoading(true);
        setUploadProgress(15);

        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/media',
        });

        if (newBlob?.url) {
          uploadedUrlsRef.current.push(newBlob.url);
          setUploadProgress(100);

          if (caption && caption.trim()) {
            const figureHtml = `
              <figure class="my-6 text-center">
                <img src="${newBlob.url}" alt="${validatedAlt}" class="rounded-xl max-h-[400px] object-cover mx-auto shadow-md" />
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
        console.error("Image upload failed:", err);
        alert('Network error uploading image.');
      } finally {
        setTimeout(() => {
          setImageLoading(false);
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
      const files = input.files;
      if (!files || files.length === 0) return;
      const file = files[0];

      try {
        setVideoLoading(true);
        setUploadProgress(5);

        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/media',
          multipart: true,
          onUploadProgress: (progressEvent) => {
            setUploadProgress(progressEvent.percentage);
          }
        });

        if (newBlob?.url) {
          uploadedUrlsRef.current.push(newBlob.url);
          setUploadProgress(100);
          
          // ESCAPE HATCH: Direct string insertion bypasses Tiptap's strict command types completely
          const videoHtml = `
            <div class="w-full block clear-both" contenteditable="false">
              <video src="${newBlob.url}" controls="true" preload="metadata" class="w-full aspect-video rounded-xl my-6 shadow-md bg-black"></video>
            </div>
          `;

          editor
            .chain()
            .focus()
            .insertContent(videoHtml)
            .insertContent({ type: 'paragraph' })
            .run();
        }
      } catch (err) {
        console.error("Video upload details:", err);
        alert('Error uploading large video asset.');
      } finally {
        setTimeout(() => {
          setVideoLoading(false);
          setUploadProgress(0);
        }, 800);
      }
    };
    input.click();
  };

  const isAnyUploading = imageLoading || videoLoading;

  return (
    <div className="w-full flex flex-col relative">
      <div className="flex flex-wrap gap-1.5 bg-slate-900 border border-slate-800 p-2 rounded-t-xl border-b-0 relative">
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          B
        </button>
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2.5 py-1 text-xs italic rounded ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          I
        </button>
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          H2
        </button>
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          H3
        </button>
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          “ Quote
        </button>
        
        <div className="w-px bg-slate-800 mx-1" />

        <button
          type="button"
          disabled={isAnyUploading}
          onClick={addLink}
          className={`px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 ${editor.isActive('link') ? 'text-blue-400' : ''}`}
        >
          🔗 Link
        </button>
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={addImageLocally}
          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          {imageLoading ? '⌛ Uploading...' : '🖼️ Image'}
        </button>
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={addVideoLocally}
          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          {videoLoading ? '⌛ Uploading...' : '📺 Video'}
        </button>

        {isAnyUploading && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
        )}
      </div>

      <div className={isAnyUploading ? "pointer-events-none opacity-80" : ""}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
