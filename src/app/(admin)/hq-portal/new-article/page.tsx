"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '../components/RichTextEditor';
import MediaSelector from '../components/MediaSelector'; // Import the new file selection tool
import { createArticle } from '../article-actions';

export default function NewArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Field parameters mapping directly to your Prisma Schema
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('General');
  const [isPublished, setIsPublished] = useState(false);
  const [content, setContent] = useState('<p>Start writing your news scoop here...</p>');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await createArticle({
      title,
      excerpt,
      content,
      imageUrl,
      category,
      isPublished,
    });

    setLoading(false);

    if (result.success) {
      alert('News article deployed and indexing parameters optimized!');
      router.push('/hq-portal');
    } else {
      setError(result.error || 'Failed to submit article.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <span className="text-xs uppercase font-bold tracking-widest text-blue-500">Newsroom Desk</span>
          <h1 className="text-2xl font-black text-white mt-1">Compose Breaking News Asset</h1>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-xs p-3 rounded-xl mb-4 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Headline Title</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-base font-bold text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., Local PostgreSQL Connection Proves Highly Successful"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Article Body Content</label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </div>

          {/* Sidebar Metadata Configuration Controls */}
          <div className="w-full lg:w-80 flex flex-col gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl h-fit">
            <h3 className="text-xs font-black uppercase text-white tracking-wider border-b border-slate-800 pb-2 mb-1">Publishing Settings</h3>
            
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Google Snippet Excerpt</label>
              <textarea
                rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                placeholder="Short summary for Google News snippet card layouts..."
              />
            </div>

            {/* ─── CAREFULLY UPDATED: TEXT INPUT FIELD SWAPPED WITH NATIVE FILE PICKER ─── */}
            <div>
              <MediaSelector 
                label="Featured Cover Image"
                accept="image/*"
                currentUrl={imageUrl}
                onUploadSuccess={setImageUrl} // Directly populates file string parameter path (/media/filename)
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Editorial Category</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="General">General</option>
                <option value="Airport News">Airport News</option>
                <option value="Airplane News">Airplane News</option>
          
              </select>
            </div>

            <div className="flex items-center gap-2.5 py-2 border-t border-slate-800 mt-2">
              <input
                type="checkbox" id="isPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 bg-slate-950 border-slate-800 rounded text-blue-600 focus:ring-0"
              />
              <label htmlFor="isPublished" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                Deploy live to public index feed
              </label>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Committing to PostgreSQL...' : 'Publish News Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
