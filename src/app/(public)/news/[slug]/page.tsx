import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import SocialShare from '../../components/SocialShare';

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── AGGRESSIVE COST REDUCTION: CACHE INDEFINITELY AT THE GLOBAL CDN EDGE ───
export const revalidate = false;

// ─── PRE-BUILD TOP HIGH-TRAFFIC ARTICLES TO SHIELD NEON DB AT LAUNCH ───
export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 500, // Pre-compiles the 500 latest articles. Older ones build on-demand and cache forever.
    select: { slug: true },
  });

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// ─── DYNAMIC SEO METADATA FOR BROWSER & SOCIAL SHARE CARDS ───
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await prisma.article.findUnique({
    where: { slug: resolvedParams.slug },
    include: { author: true } // ✨ Included relation hook to feed writer profiles directly into tags
  });

  if (!article || !article.isPublished) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerosaga.com';

  return {
    metadataBase: new URL(siteUrl),
    title: `${article.title} | Aero Saga`,
    description: article.excerpt || `Read the full aviation dispatch: ${article.title}`,
    
    // ✨ Google News Bot explicit crawling configuration signals
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },

    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      type: 'article',
      url: `/news/${article.slug}`,
      siteName: 'Aero Saga',
      publishedTime: article.createdAt.toISOString(), // ✨ Mandatory Google Discover structured dates
      modifiedTime: article.updatedAt.toISOString(),
      section: article.category,
      authors: [article.author?.name || 'Aero Saga Staff'],
      images: article.imageUrl ? [{ url: article.imageUrl, width: 1200, height: 630, alt: article.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || undefined,
      images: article.imageUrl ? [article.imageUrl] : [],
    }
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

  // ─── COST-OPTIMIZED RELATED POSTS PIPELINE (Computed once at build time) ───
  const relatedArticles = await prisma.article.findMany({
    where: {
      category: article.category,
      isPublished: true,
      NOT: { id: article.id }, // Never show the current article as related to itself
    },
    orderBy: { createdAt: 'desc' },
    take: 3, // Pull exactly 3 items to fit a clean responsive desktop layout row
    include: { author: true },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerosaga.com';

  // ─── OPTIMIZED GOOGLE NEWS JSON-LD STRUCTURED DATA SCHEMA ───
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle', // ✨ Kept strict schema tracking context intact
    'headline': article.title,
    'description': article.excerpt || article.title,
    'image': article.imageUrl ? [article.imageUrl] : [`${siteUrl}/logo.png`],
    'datePublished': article.createdAt.toISOString(),
    'dateModified': article.updatedAt.toISOString(),
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${siteUrl}/news/${article.slug}`,
    },
    'author': {
      '@type': 'Person',
      'name': article.author.name,
      'jobTitle': article.author.title || 'Journalist',
      'description': article.author.bio || undefined,
      'image': article.author.avatarUrl || undefined,
      'sameAs': article.author.sameAsLinks || [], // ✨ Maps authority back footprints seamlessly
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Aero Saga',
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/logo.png`, // Adjusted placeholder lookup variables cleanly
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
          <Link href={`/category/${article.category.toLowerCase().replace(/\s+/g, '-')}`}>
            <span className="text-xs font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-2.5 py-1 rounded">
              {article.category}
            </span>
          </Link>
          <h1 className="article-title font-black text-slate-900 mt-4 mb-6 leading-tight tracking-tight text-3xl md:text-5xl">
            {article.title}
          </h1>

          {/* Journalist Bio Identity Details */}
          <div className="flex items-center gap-4 border-y border-slate-100 py-4 mb-8">
            {article.author.avatarUrl && (
              <img 
                src={article.author.avatarUrl} 
                alt={article.author.name}
                loading="lazy"
                decoding="async"
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
                loading="eager" // Main feature cover image should load immediately for performance
                decoding="async"
                className="w-full h-full object-contain object-center rounded-2xl"
              />
            </div>
          )}
          
          <div 
            className="prose prose-slate max-w-none text-slate-800 leading-relaxed article-content font-serif tracking-normal
                       prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tight
                       prose-video:w-full prose-video:aspect-video prose-video:rounded-2xl prose-video:shadow-md prose-video:bg-slate-950 prose-video:my-8 prose-video:border prose-video:border-slate-100
                       prose-figure:my-8 prose-figure:mx-auto prose-figure:text-center
                       prose-img:rounded-2xl prose-img:shadow-sm prose-img:mx-auto prose-img:my-0
                       prose-figcaption:text-xs prose-figcaption:text-slate-400 prose-figcaption:mt-3 prose-figcaption:italic prose-figcaption:font-sans prose-figcaption:tracking-wide"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <SocialShare title={article.title} slug={article.slug} />
          {article.author.bio && (
            <footer className="mt-16 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-3 font-sans">
              <h3 className="font-black text-xs uppercase tracking-widest text-blue-600">About the Author</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{article.author.bio}</p>
              {article.author.sameAsLinks && article.author.sameAsLinks.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-1">
                  {article.author.sameAsLinks.map((link, index) => {
                    let dynamicLabel = `Verification Link ${index + 1}`;
                    try {
                      if (link && link.trim().startsWith('http')) {
                        const urlObj = new URL(link.trim());
                        const host = urlObj.hostname.replace('www.', '');
                        const brandParts = host.split('.');
                        const rawBrand = brandParts[0];
                        dynamicLabel = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
                      }
                    } catch (e) {}

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

        {/* ─── THE PERSISTENT VISUAL SIDEBAR COMPARTMENT ROW ─── */}
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-xl text-white shadow-lg border border-slate-800">
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

      {/* ─── NEW SHIELD SECTION: FREE CDN-CACHED RELATED ARTICLES MODULE ─── */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50/50 py-12 mt-4 font-sans">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="mb-8">
              <span className="text-xs uppercase font-bold tracking-widest text-blue-600">Editorial Stream</span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">Related News</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((item) => (
                <div key={item.id} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between p-4">
                  <div>
                    {item.imageUrl && (
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-100/60 mb-4">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"   
                          decoding="async" 
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h4 className="font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                      <Link href={`/news/${item.slug}`}>
                        {item.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-slate-700">{item.author.name}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
