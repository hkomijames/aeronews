import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── DYNAMIC SEO METADATA FOR BROWSER & SOCIAL SHARE CARDS ───
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await prisma.article.findUnique({
    where: { slug: resolvedParams.slug },
  });

  if (!article || !article.isPublished) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://avnewsroom.com';

  return {
    // ─── FIXED: Injected metadataBase fallback pointer to resolve image relative strings safely ───
    metadataBase: new URL(siteUrl),
    title: `${article.title} | AV Newsroom`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      type: 'article',
      url: `/news/${article.slug}`,
      images: article.imageUrl ? [{ url: article.imageUrl }] : [],
    },
  };
}

// ─── MAIN SERVER-RENDERED PAGE COMPONENT ───
export default async function ArticlePage({ params }: Props) {
  const resolvedParams = await params;
  
  const article = await prisma.article.findUnique({
    where: { slug: resolvedParams.slug },
    include: { author: true },
  });

  if (!article || !article.isPublished) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://avnewsroom.com';

  // ─── OPTIMIZED GOOGLE NEWS JSON-LD STRUCTURED DATA SCHEMA ───
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': article.title,
    'description': article.excerpt || article.title,
    'image': article.imageUrl ? [article.imageUrl] : [],
    'datePublished': article.createdAt.toISOString(),
    'dateModified': article.updatedAt.toISOString(),
    'author': {
      '@type': 'Person',
      'name': article.author.name,
      'jobTitle': article.author.title || 'Journalist',
      'description': article.author.bio || undefined,
      'image': article.author.avatarUrl || undefined,
      'sameAs': article.author.sameAsLinks,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'AV Newsroom',
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/logo.png`,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Structural Wrapper Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEFT & CENTER CLUSTERS: MAIN EDITORIAL CONTENT ENGINE */}
        <main className="lg:col-span-2">
          <span className="text-xs font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-2.5 py-1 rounded">
            {article.category}
          </span>
          
          <h1 className="article-title font-black text-slate-900 mt-4 mb-6 leading-tight tracking-tight">
            {article.title}
          </h1>

          {/* Journalist Bio Identity Details */}
          <div className="flex items-center gap-4 border-y border-slate-100 py-4 mb-8">
            {article.author.avatarUrl && (
              <img 
                src={article.author.avatarUrl} 
                alt={article.author.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">{article.author.name}</span>
                {article.author.title && (
                  <>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{article.author.title}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Published: {new Date(article.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {article.imageUrl && (
            <div className="w-full h-100 bg-slate-50 rounded-2xl overflow-hidden mb-10 shadow-sm border border-slate-100">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* ─── CAREFULLY UPDATED: News-Worthy Premium Editorial Font Canvas ─── */}
          <div 
            className="prose prose-slate max-w-none text-slate-800 leading-relaxed article-content font-serif tracking-normal
                       prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tight
                       prose-video:w-full 
                       prose-video:aspect-video 
                       prose-video:rounded-2xl 
                       prose-video:shadow-md 
                       prose-video:bg-slate-950 
                       prose-video:my-8 
                       prose-video:border 
                       prose-video:border-slate-100
                       prose-figure:my-8 
                       prose-figure:mx-auto 
                       prose-figure:text-center
                       prose-img:rounded-2xl 
                       prose-img:shadow-sm 
                       prose-img:mx-auto 
                       prose-img:my-0
                       prose-figcaption:text-xs 
                       prose-figcaption:text-slate-400 
                       prose-figcaption:mt-3 
                       prose-figcaption:italic 
                       prose-figcaption:font-sans 
                       prose-figcaption:tracking-wide"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.author.bio && (
            <footer className="mt-16 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-3 font-sans">
              <h3 className="font-black text-xs uppercase tracking-widest text-blue-600">About the Author</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{article.author.bio}</p>
              {article.author.sameAsLinks.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-1">
  {article.author.sameAsLinks.map((link, index) => {
    // ─── OPTIMIZED: EXTRACT REAL-TIME BRAND TITLES FOR PUBLIC ARCHIVES ───
    let dynamicLabel = `Verification Link ${index + 1}`;
    try {
      if (link && link.trim().startsWith('http')) {
        const urlObj = new URL(link.trim());
        // Clean up subdomains (like www.) to extract the primary host name
        const host = urlObj.hostname.replace('www.', '');
        const brandParts = host.split('.');
        
        // Grab the brand name (e.g. "linkedin" or "muckrack") and capitalize the first letter
        const rawBrand = brandParts[0];
        dynamicLabel = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
      }
    } catch (e) {
      // Graceful fallback if the string model saved in Prisma is somehow broken
    }

    return (
      <a 
        key={index} 
        href={link} 
        target="_blank" 
        rel="noreferrer" 
        className="text-xs text-blue-600 hover:underline font-bold transition-colors duration-150"
      >
        {dynamicLabel}
      </a>
    );
  })}
</div>

              )}
            </footer>
          )}
        </main>

        {/* ─── ADDED: THE PERSISTENT VISUAL SIDEBAR COMPARTMENT ROW ─── */}
        <aside className="space-y-8 lg:col-span-1 lg:sticky lg:top-8 h-fit">
          
          {/* Most Read Component */}
          <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 mb-4">Most Read Coverage</h3>
            <ol className="flex flex-col gap-4">
              <li className="flex gap-3 items-start">
                <span className="font-black text-slate-300 text-lg leading-none mt-0.5">01</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer leading-snug">Global Airport Infrastructure Spending Surges to Match Next-Gen Architectural Layouts</h4>
                </div>
              </li>
              <li className="flex gap-3 items-start border-t border-slate-200/40 pt-3">
                <span className="font-black text-slate-300 text-lg leading-none mt-0.5">02</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer leading-snug">Autonomous Flight Controls Clear Major Validation Milestones Over Open Water Trials</h4>
                </div>
              </li>
            </ol>
          </div>

          {/* Flight Briefing Box */}
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
        </aside>

      </div>
    </div>
  );
}
