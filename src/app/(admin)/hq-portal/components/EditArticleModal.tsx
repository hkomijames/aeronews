"use client";

import { useState, useRef } from 'react';
import { updateArticle } from '../article-actions';

interface ModalProps {
  article: {
    id: string;
    title: string;
    category: string;
    excerpt: string | null;
  };
}

export default function EditArticleModal({ article }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(article.title);
  const [category, setCategory] = useState(article.category);
  const [excerpt, setExcerpt] = useState(article.excerpt || '');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(false);
    
    const res = await updateArticle(article.id, { title, category, excerpt });
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
        ✏️ Edit Metadata
      </button>

      <dialog 
        ref={dialogRef} 
        className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-slate-100 max-w-md w-full backdrop:bg-black/70 focus:outline-none shadow-2xl"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-sm font-black text-white">Quick Metadata Overrides</h3>
          <button onClick={() => dialogRef.current?.close()} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Headline Title</label>
            <input 
              type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Google News Snippet Excerpt</label>
            <textarea 
              rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
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

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors mt-2"
          >
            {loading ? 'Saving adjustments...' : 'Apply Metadata Overrides'}
          </button>
        </form>
      </dialog>
    </>
  );
}
