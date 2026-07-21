"use client";

import { useState, useRef } from 'react';
import { updateArticle } from '../article-actions';

interface ModalProps {
  article: {
    id: string;
    title: string;
    category: string;
    excerpt: string | null;
    content: string | null; // ✨ Added required main content block to the data contract
  };
}

export default function EditArticleModal({ article }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(article.title);
  const [category, setCategory] = useState(article.category);
  const [excerpt, setExcerpt] = useState(article.excerpt || '');
  const [content, setContent] = useState(article.content || ''); // ✨ Initialized state for editing main copy

  // Fixed form typing using modern event parameters to block warnings
  async function handleSave(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    // Dispatches complete data sync block including content mutations
    const res = await updateArticle(article.id, { title, category, excerpt, content });
    if (res.success) {
      dialogRef.current?.close();
    } else {
      alert(res.error || 'Update failed.');
    }
    setLoading(false);
  }

  return (
    <>
      <button 
        onClick={() => dialogRef.current?.showModal()}
        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded transition-colors text-[10px]"
      >
        ✏️ Edit Article
      </button>

      <dialog 
        ref={dialogRef} 
        className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-slate-100 max-w-2xl w-full backdrop:bg-black/70 focus:outline-none shadow-2xl"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-sm font-black text-white">Modify Article Copy</h3>
          <button onClick={() => dialogRef.current?.close()} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Headline Title</label>
              <input 
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Editorial Category</label>
              <select 
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="General">General</option>
                <option value="Airport News">Airport News</option>
                <option value="Airplane News">Airplane News</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Google News Snippet Excerpt</label>
            <textarea 
              rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* ✨ New Main Content Textarea Interface element block */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Main Article Content Body Copy</label>
            <textarea 
              rows={12} value={content} onChange={(e) => setContent(e.target.value)} required
              placeholder="Draft your main body narrative blocks here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors mt-2"
          >
            {loading ? 'Committing body copy changes...' : 'Save & Deploy Story Modifications'}
          </button>
        </form>
      </dialog>
    </>
  );
}
