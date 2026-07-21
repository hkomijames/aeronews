import { prisma } from '@/lib/db';
import Link from 'next/link';

export const revalidate = 900;

export default async function PublicHomePage() {
  // 1. Fetch live articles from PostgreSQL via Prisma for instant SSR speeds
  const allArticles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: { author: true },
  });

  // ─── DATA PIPELINE SEGMENTATION MATCHING NEW LAYOUT SPECS ───
  // A: Extract Top 3 absolute latest articles regardless of category for Top Showcase
  const topLatestArticles = allArticles.slice(0, 3);

  // B: Airplane News Stream Segmentation
  const allAirplaneArticles = allArticles.filter(a => a.category === 'Airplane News');
  const airplaneGrid = allAirplaneArticles.slice(0, 2);
  const airplaneSubList = allAirplaneArticles.slice(2, 8);

  // C: Airport News Stream Segmentation
  const allAirportArticles = allArticles.filter(a => a.category === 'Airport News');
  const airportGrid = allAirportArticles.slice(0, 2);
  const airportSubList = allAirportArticles.slice(2, 8);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* ─── 1. TOP EXTENDED DARK AREA: LATEST 3 REPRINTS SHOWCASE ─── */}
      <section className="w-full bg-slate-950 text-white py-16 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="border-b border-slate-800 pb-3 mb-8">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Featured Coverage <span className="text-base">.</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Latest breaking dispatches curated straight from our news desks.</p>
          </div>

          {topLatestArticles.length === 0 ? (
            <div className="h-50 flex items-center justify-center text-slate-500 text-xs italic">
              No aviation articles published yet. Use your admin dashboard to create posts.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topLatestArticles.map((article) => (
                <div key={article.id} className="relative h-95 bg-slate-900 rounded-xl overflow-hidden border border-slate-800/60 shadow-2xl group cursor-pointer">
                  {/* Note: CSS Background Images cannot be native lazy loaded, but the layout is preserved here */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `linear-gradient(to top, rgba(2, 6, 23, 0.98) 25%, rgba(2, 6, 23, 0.2)), url(${article.imageUrl || '/placeholder.jpg'})` }}
                  />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <span className="text-[9px] font-black tracking-widest text-orange-400 uppercase mb-1">{article.category}</span>
                    <Link href={`/news/${article.slug}`}>
                      <h3 className="font-extrabold text-base leading-snug text-white group-hover:text-orange-400 transition-colors">
                        {article.title}
                      </h3>
                    </Link>
                    <Link href={`/news/${article.slug}`} className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors mt-3 block underline underline-offset-4">
                      Read it →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 2. AIRPLANE NEWS SECTION (2 Grid Cards + 6 List Rows + Sidebar Right) ─── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: AIRPLANE NEWS CONTENT CLUSTER */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-baseline border-b border-slate-100 pb-3 mb-6">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Airplane Saga</h2>
            <Link href="/category/airplane-news" className="text-xs text-blue-600 font-bold hover:underline">
              View All Airplane News →
            </Link>
          </div>

          {/* 2 Primary Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {airplaneGrid.map((article) => (
              <article key={article.id} className="group cursor-pointer">
                <Link href={`/news/${article.slug}`}>
                  <div className="w-full aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-100 mb-3 shadow-sm">
                    <img 
                      src={article.imageUrl || ''} 
                      alt={article.title} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{article.category}</span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-1 leading-snug group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </Link>
              </article>
            ))}
          </div>
          {/* 6 Secondary Sub-Row Lists */}
          <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
            {airplaneSubList.map((article) => (
              <Link href={`/news/${article.slug}`} key={article.id} className="flex gap-4 items-center group cursor-pointer">
                <div className="w-24 h-16 bg-slate-50 border border-slate-100 rounded-md overflow-hidden shrink-0">
                  <img 
                    src={article.imageUrl || ''} 
                    alt={article.title} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div>
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{article.category}</span>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mt-0.5">
                    {article.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{article.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR UTILITY INFRASTRUCTURE */}
        <div className="space-y-8">
          {/* Top Ranked Sidebar Component */}
          <div className="bg-slate-50/60 border border-slate-100 p-5 rounded-xl">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider border-b border-slate-200/60 pb-3 mb-4">Most Read</h3>
            <ol className="flex flex-col gap-4">
              <li className="flex gap-3 items-start">
                <span className="font-black text-slate-300 text-lg leading-none mt-0.5">01</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer leading-snug">Global Airport Infrastructure Spending Surges to Match Next-Gen Architectural Layouts</h4>
                </div>
              </li>
              <li className="flex gap-3 items-start border-t border-slate-200/30 pt-3">
                <span className="font-black text-slate-300 text-lg leading-none mt-0.5">02</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer leading-snug">Autonomous Flight Controls Clear Major Validation Milestones Over Open Water Trials</h4>
                </div>
              </li>
            </ol>
          </div>

          {/* Flight Briefing Box Element */}
          <div className="bg-linear-to-br from-slate-900 to-slate-950 p-6 rounded-xl text-white shadow-lg border border-slate-800">
            <span className="text-xl">✉️</span>
            <h3 className="font-extrabold text-base mt-2">Flight Briefing</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed mb-4">
              The latest aviation scoops, delivered straight to your inbox every morning.
            </p>
            <form className="flex flex-col gap-2">
              <input 
                type="email" 
                placeholder="Enter corporate email..." 
                required 
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500" 
              />
              <button 
                type="button" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2 rounded-lg transition-colors"
              >
                Join Elite Network
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* ─── 3. AIRPORT NEWS SECTION (2 Grid Cards + 6 List Rows Running Full Width) ─── */}
      <section className="bg-slate-50/30 border-t border-slate-100 py-12">
        <main className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-baseline border-b border-slate-100 pb-3 mb-6">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Airport Saga</h2>
              <Link href="/category/airport-news" className="text-xs text-blue-600 font-bold hover:underline">
                View All Airport News →
              </Link>
            </div>

            {/* 2 Primary Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {airportGrid.map((article) => (
                <article key={article.id} className="group cursor-pointer">
                  <Link href={`/news/${article.slug}`}>
                    <div className="w-full aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-100 mb-3 shadow-sm">
                      <img 
                        src={article.imageUrl || '/placeholder.jpg'} 
                        alt={article.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{article.category}</span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1 leading-snug group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </Link>
                </article>
              ))}
            </div>

            {/* 6 Secondary Sub-Row Lists */}
            <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
              {airportSubList.map((article) => (
                <Link href={`/news/${article.slug}`} key={article.id} className="flex gap-4 items-center group cursor-pointer">
                  <div className="w-24 h-16 bg-slate-50 border border-slate-100 rounded-md overflow-hidden shrink-0">
                    <img 
                      src={article.imageUrl || '/placeholder.jpg'} 
                      alt={article.title} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{article.category}</span>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mt-0.5">
                      {article.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{article.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Empty column placeholder to maintain structural alignment with top sidebar layout blocks */}
          <div className="hidden lg:block"></div>
        </main>
      </section>
    </div>
  );
}
