"use client";

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { upload } from '@vercel/blob/client';
import { compressImageForUpload } from '@/lib/optimize-image';
import { getLinkAttributes, sanitizeLinkAttributesInHtml } from '@/lib/link-attributes';

// Custom Image Extension supporting Blogger-style Sizing Parameters
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      dataSize: {
        default: 'large',
        parseHTML: element => element.getAttribute('data-size'),
        renderHTML: attributes => ({
          'data-size': attributes.dataSize,
        }),
      },
    };
  },
});

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  isSaved?: boolean;
}

export default function RichTextEditor({ content, onChange, isSaved = false }: EditorProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkNofollow, setLinkNofollow] = useState(false);

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
      // Configure everything inside the unified StarterKit definition block
      StarterKit.configure({ 
        hardBreak: {},
        // Pass your custom Link configurations directly here
        link: {
          openOnClick: false,
          HTMLAttributes: { class: 'text-blue-400 underline cursor-pointer' }
        }
      }),
      // Removed standalone Link extension from here
      CustomImage.configure({ 
        HTMLAttributes: { class: 'rounded-xl max-h-[400px] object-cover mt-6 mx-auto shadow-md transition-all' } 
      }),
      Youtube.configure({ 
        HTMLAttributes: { class: 'w-full aspect-video rounded-xl my-6 shadow-md' } 
      }),
    ],
    content: sanitizeLinkAttributesInHtml(content, { nofollow: false }),
    immediatelyRender: false, 
    onUpdate: ({ editor }) => { onChange(sanitizeLinkAttributesInHtml(editor.getHTML(), { nofollow: false })); },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[350px] bg-slate-950 border border-slate-800 rounded-b-xl p-4 focus:outline-none focus:border-slate-700 text-slate-200 overflow-y-auto whitespace-pre-wrap prose-p:my-4 prose-p:min-h-[1.5rem] prose-br:before:content-none prose-figure:my-6 prose-figure:text-center prose-img:rounded-xl prose-img:max-h-[400px] prose-img:object-cover prose-img:mx-auto prose-img:shadow-md prose-figcaption:text-xs prose-figcaption:text-slate-400 prose-figcaption:mt-2 prose-figcaption:italic prose-figcaption:font-sans',
        spellcheck: 'true',
      },
      handleKeyDown(view, event) {
        if (event.key === 'Backspace' || event.key === 'Delete') {
          const { state } = view;
          const { selection } = state;
          let targetUrl = '';

          if (selection instanceof Object && 'node' in selection && selection.node) {
            const selectedNode = (selection as any).node;
            const nodeType = selectedNode.type?.name;

            if (nodeType === 'image' && selectedNode.attrs) {
              targetUrl = selectedNode.attrs.src;
            }
          } 
          else {
            const pos = event.key === 'Backspace' ? selection.$from.before() : selection.$from.after();
            try {
              const nodeAdjacent = state.doc.nodeAt(pos);
              if (nodeAdjacent) {
                const type = nodeAdjacent.type.name;
                
                if (type === 'image' && nodeAdjacent.attrs?.src) {
                  targetUrl = nodeAdjacent.attrs.src;
                }
              }
            } catch (e) {
              // Ignore out-of-bounds selection blocks quietly
            }
          }

          if (targetUrl) {
            deleteBlobFromCloud(targetUrl);
          }
        }
        return false;
      }
    },
  });


  if (!editor) return null;

  const addLink = () => {
    if (linkFormOpen) {
      setLinkFormOpen(false);
      return;
    }

    const existingLink = (editor.getAttributes('link').href as string | undefined) || '';
    const existingRel = (editor.getAttributes('link').rel as string | undefined) || '';

    setLinkUrlInput(existingLink);
    setLinkNofollow(existingRel.includes('nofollow'));
    setLinkFormOpen(true);
  };

  const applyLink = () => {
    const trimmedUrl = linkUrlInput.trim();
    if (!trimmedUrl) return;

    editor.chain()
      .focus()
      .extendMarkRange('link')
      .setLink(getLinkAttributes(trimmedUrl, { nofollow: linkNofollow }))
      .run();

    setLinkFormOpen(false);
    setLinkUrlInput('');
    setLinkNofollow(false);
  };

  const cancelLinkForm = () => {
    setLinkFormOpen(false);
    setLinkUrlInput('');
    setLinkNofollow(false);
  };

  const insertButtonTag = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();
    const buttonLabel = selectedText || 'Button';

    editor.chain().focus().insertContent(`<button type="button">${buttonLabel}</button>`).run();
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

        const optimizedFile = await compressImageForUpload(file);
        const newBlob = await upload(optimizedFile.name, optimizedFile, {
          access: 'public',
          handleUploadUrl: '/api/media',
        });

        if (newBlob?.url) {
          uploadedUrlsRef.current.push(newBlob.url);
          setUploadProgress(100);

          if (caption && caption.trim()) {
            const figureHtml = `
              <figure class="my-6 text-center">
                <img src="${newBlob.url}" alt="${validatedAlt}" data-size="large" class="rounded-xl max-h-100 object-cover mx-auto shadow-md" />
                <figcaption class="text-xs text-slate-400 mt-2 font-sans">
                  <i>${caption.trim()}</i>
                </figcaption>
              </figure>
            `;
            editor.chain().focus().insertContent(figureHtml).run();
          } else {
            // Defaulting custom schema parameter to large dynamically on fallback insertion loop
            editor.chain().focus().setImage({ src: newBlob.url, alt: validatedAlt }).updateAttributes('image', { dataSize: 'large' }).run();
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
  // Helper command to mutate Blogger-style sizing metrics on the selected image element node
  const resizeSelectedImage = (size: 'small' | 'medium' | 'large') => {
    editor.chain().focus().updateAttributes('image', { dataSize: size }).run();
  };

  const isAnyUploading = imageLoading;

  return (
    <div className="w-full flex flex-col relative">
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-2 rounded-t-xl border-b-0 relative">
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
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2.5 py-1 text-xs font-bold rounded ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
        >
          • Bullet
        </button>
        
        <div className="w-px bg-slate-800 mx-1 self-stretch" />

        <button
          type="button"
          disabled={isAnyUploading}
          onClick={insertButtonTag}
          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200"
        >
          ⬢ Button
        </button>
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={addLink}
          className={`px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 ${editor.isActive('link') ? 'text-blue-400' : ''}`}
        >
          🔗 Link
        </button>
        {linkFormOpen && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2 shadow-lg">
            <input
              type="url"
              value={linkUrlInput}
              onChange={(event) => setLinkUrlInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyLink();
                }
              }}
              placeholder="https://example.com"
              className="min-w-55 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
            />
            <label className="flex items-center gap-1 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={linkNofollow}
                onChange={(event) => setLinkNofollow(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900"
              />
              nofollow
            </label>
            <button
              type="button"
              onClick={applyLink}
              className="rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={cancelLinkForm}
              className="rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300"
            >
              Cancel
            </button>
          </div>
        )}
        <button
          type="button"
          disabled={isAnyUploading}
          onClick={addImageLocally}
          className="px-2.5 py-1 text-xs font-medium rounded bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          {imageLoading ? '⌛ Uploading...' : '🖼️ Image'}
        </button>
        {/* DYNAMIC CONTEXTUAL TOOLBAR ELEMENT: Displays resizing choices if an image node is highlighted */}
        {editor.isActive('image') && (
          <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 ml-auto animate-fade-in">
            <button 
              type="button" 
              onClick={() => resizeSelectedImage('small')} 
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${editor.getAttributes('image').dataSize === 'small' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Small
            </button>
            <button 
              type="button" 
              onClick={() => resizeSelectedImage('medium')} 
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${editor.getAttributes('image').dataSize === 'medium' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Medium
            </button>
            <button 
              type="button" 
              onClick={() => resizeSelectedImage('large')} 
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${editor.getAttributes('image').dataSize === 'large' || !editor.getAttributes('image').dataSize ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Original
            </button>
          </div>
        )}

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
