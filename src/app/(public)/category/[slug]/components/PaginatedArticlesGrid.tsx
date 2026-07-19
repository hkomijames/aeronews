"use client";

import { useState } from 'react';
import Link from 'next/link';
import { fetchMoreArticles } from '../category-actions';

interface Author {
  name: string;
  title: string | null;
  avatarUrl: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: Author;
}

interface GridProps {
  initialArticles: Article[];
  categoryName: string;
}

export default function PaginatedArticlesGrid({ initialArticles, categoryName }: GridProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [skip, setSkip] = useState(12); // Initial page load already fetched 12
  const [hasMore, setHasMore] = useState(initialArticles.length === 12);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);

    const res = await fetchMoreArticles(categoryName, skip, 6);

    if (res.success && res.articles.length > 0) {
      setArticles((prev) => [...prev, ...res.articles as any]);
      setSkip((prev) => prev + 6);
      if (res.articles.length < 6) {
        setHasMore(false); // No more entries inside database pool
      }
    } else {
      setHasMore(false);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-12">
      {/* Responsive Article Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <article 
            key={article.id} 
            className="bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col group"
          >
            {article.imageUrl && (
              <div className="w-full aspect-video overflow-hidden bg-slate-950 border-b border-slate-800/40 relative">
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 group-hover:text-white leading-snug line-clamp-2">
                  <Link href={`/news/${article.slug}`} className="hover:underline">
                    {article.title}
                  </Link>
                </h2>
                <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center gap-3">
                {article.author.avatarUrl ? (
                  <img 
                    src={article.author.avatarUrl} 
                    alt={article.author.name} 
                    className="w-8 h-8 rounded-full bg-slate-800 object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">AV</div>
                )}
                <div>
                  <span className="text-xs font-bold text-slate-300 block">{article.author.name}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{article.author.title || 'Staff Writer'}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* View More Controller Triggers */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-xs px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Fetching content layers...' : 'View More Articles ↓'}
          </button>
        </div>
      )}
    </div>
  );
}
