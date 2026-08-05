import { prisma } from '@/lib/db';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import nextDynamic from 'next/dynamic';
import MostReadList from './components/MostReadList';
import AirModelAffiliate from './components/AirModelAffiliate';

// ─── STOP TIME-BASED CHECKS: CACHE INDEFINITELY AT GLOBAL EDGE CDN ───
export const dynamic = 'force-static';
export const revalidate = false;

const NewsletterForm = nextDynamic(() => import('./components/NewsletterForm'), {
  ssr: true, 
});

// ─── ISOLATED AND MEMOIZED CDN DATA ACCESS LAYER ───
const getCachedHomepageArticles = unstable_cache(
  async () => {
    return await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });
  },
  ['homepage-articles-stream'],
  { tags: ['stream-home'] }
);

export default async function PublicHomePage() {
  // Reads directly from Vercel Edge Memory cache, shielding your Neon DB completely
  const allArticles = await getCachedHomepageArticles();

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
      <p className="text-xs text-white mt-0.5 font-medium">Latest breaking dispatches curated straight from our news desks.</p>
    </div>

    {topLatestArticles.length === 0 ? (
      <div className="h-50 flex items-center justify-center text-slate-600 text-xs italic">
        No aviation articles published yet. Use your admin dashboard to create posts.
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topLatestArticles.map((article, index) => (
          <div key={article.id} className="relative h-95 bg-slate-900 rounded-xl overflow-hidden border border-slate-800/60 shadow-2xl group">
            
            {/* 1. STRUCTURAL IMAGE: Instantly discoverable by PageSpeed HTML parsing engines */}
            <img
              src={article.imageUrl || '/logo.png'}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              
              // CRITICAL: The very first card in the loop is your LCP element. Load it instantly!
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
            />

            {/* 2. GRADIENT LAYER OVERLAY: Extracted out of inline CSS styles into standard Tailwind utility nodes */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/98 via-slate-950/20 to-transparent pointer-events-none" />

            {/* 3. CONTENT BOUNDARY LAYOUT BOX */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
              <span className="text-[9px] font-black tracking-widest text-orange-400 uppercase mb-1">{article.category}</span>
              <h3 className="font-extrabold text-base leading-snug text-white group-hover:text-orange-400 transition-colors">
                <Link href={`/news/${article.slug}`} className="after:absolute after:inset-0">
                  {article.title}
                </Link>
              </h3>
              <div className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors mt-3 block underline underline-offset-4 pointer-events-none">
                Read it →
              </div>
            </div>

          </div>
        ))}
      </div>
    )}
  </div>
</section>


      {/* ─── 2. AIRPLANE + AIRPORT NEWS SECTION ─── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-10">
          <div className="space-y-12">
            <section>
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-3 mb-6">
                <h2 className="text-xl font-black tracking-tight text-slate-900">Airplane Saga</h2>
                <Link href="/category/airplane-news" className="text-xs text-blue-600 font-bold hover:underline">
                  View All Airplane News →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {airplaneGrid.map((article) => (
                  <article key={article.id} className="group relative">
                    <div className="w-full aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-100 mb-3 shadow-sm">
                      <img 
                        src={article.imageUrl || '/logo.png'} 
                        alt={article.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{article.category}</span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1 leading-snug group-hover:text-blue-600 transition-colors">
                      <Link href={`/news/${article.slug}`} className="after:absolute after:inset-0">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
                {airplaneSubList.map((article) => (
                  <article key={article.id} className="flex gap-4 items-center group relative">
                    <div className="w-30 h-24 bg-slate-50 border border-slate-100 rounded-md overflow-hidden shrink-0">
                      <img 
                        src={article.imageUrl || '/logo.png'} 
                        alt={article.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div>
                      <span className="text-[12px] font-black text-orange-800 uppercase tracking-widest">{article.category}</span>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mt-0.5">
                        <Link href={`/news/${article.slug}`} prefetch={false} className="after:absolute after:inset-0">
                          {article.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{article.excerpt}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="bg-slate-50/30 border-t border-slate-100 pt-12">
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-3 mb-6">
                <h2 className="text-xl font-black tracking-tight text-slate-900">Airport Saga</h2>
                <Link href="/category/airport-news" className="text-xs text-blue-600 font-bold hover:underline">
                  View All Airport News →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {airportGrid.map((article) => (
                  <article key={article.id} className="group relative">
                    <div className="w-full aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-100 mb-3 shadow-sm">
                      <img 
                        src={article.imageUrl || '/logo.png'} 
                        alt={article.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{article.category}</span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1 leading-snug group-hover:text-blue-600 transition-colors">
                      <Link href={`/news/${article.slug}`} className="after:absolute after:inset-0">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
                {airportSubList.map((article) => (
                  <article key={article.id} className="flex gap-4 items-center group relative">
                    <div className="w-30 h-24 bg-slate-50 border border-slate-100 rounded-md overflow-hidden shrink-0">
                      <img 
                        src={article.imageUrl || '/logo.png'} 
                        alt={article.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div>
                      <span className="text-[12px] font-black text-orange-800 uppercase tracking-widest">{article.category}</span>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mt-0.5">
                        <Link href={`/news/${article.slug}`} prefetch={false} className="after:absolute after:inset-0">
                          {article.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{article.excerpt}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8 self-start">
            <MostReadList
              title="Most Read"
              titleClassName="font-black text-sm text-slate-900 uppercase tracking-wider"
              items={[
                { title: 'Emergency Landings on Highways in Florida', href: '/news/emergency-landings-on-highways-in-florida' },
                { title: 'She Survived 9/11 Only to Die on Flight 587 Two Months Later', href: '/news/she-survived-911-only-to-die-on-flight-587-two-months-later' },
              ]}
            />

            <NewsletterForm />

            <AirModelAffiliate
              variant="sidebar"
              title="AirModels Picks"
              subtitle="Curated aviation models and display gear."
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
