import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';

// Define the precise type blueprint required by the Next.js compilation engine
interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryNewsPage({ params }: CategoryPageProps) {
  // 1. Await route parameters to remain compliant with the Next.js compilation engine
  const { category } = await params;

  // 2. Normalize and format slugs to match your database naming constraints
  // e.g., converts "airplane-news" into a readable headline like "Airplane News"
  const formattedCategoryTitle = category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // 3. Query your Neon database directly on the server
  const articles = await prisma.article.findMany({
    where: {
      category: {
        equals: formattedCategoryTitle,
        mode: 'insensitive', // Prevents minor case-mismatch issues from throwing 404s
      },
      isPublished: true,
    },
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 4. Return an editorial 404 layout screen if the category parameter doesn't exist
  if (articles.length === 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-[80%] mx-auto">
        
        {/* Category Header */}
        <header className="mb-12 border-b border-slate-800 pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Aviation Index Feed</span>
          <h1 className="text-4xl font-black tracking-tight text-white mt-1">{formattedCategoryTitle} Desk</h1>
          <p className="text-xs text-slate-400 mt-2">
            Reviewing <span className="text-blue-400 font-bold">{articles.length}</span> live synchronized breaking reports.
          </p>
        </header>

        {/* Responsive Article Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article 
              key={article.id} 
              className="bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Thumbnail Container */}
              {article.imageUrl && (
                <div className="w-full aspect-video overflow-hidden bg-slate-950 border-b border-slate-800/40 relative">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Text Context Area */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100 group-hover:text-white leading-snug line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                {/* Author Metadata Footer */}
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

      </div>
    </main>
  );
}
