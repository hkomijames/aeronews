import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react'; // ─── IMPORT NATIVE REACT CACHE UTILITY ───
import { RenderArticleContent } from '@/lib/tweet-parser';
import nextDynamic from 'next/dynamic';
import MostReadList from '../../components/MostReadList';
import AirModelAffiliate from '../../components/AirModelAffiliate';

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── AGGRESSIVE COST REDUCTION: CACHE INDEFINITELY AT THE GLOBAL CDN EDGE ───
export const dynamic = 'force-static';
export const revalidate = false;

// ─── MAIN THREAD JS OPTIMIZATION: LOAD INTERACTIVE CLIENT COMPONENT PACKAGES DEFERRED ───
const NewsletterForm = nextDynamic(() => import('../../components/NewsletterForm'), {
  ssr: true, 
});

const SocialShare = nextDynamic(() => import('../../components/SocialShare'), {
  ssr: true,
});

// ─── HYDRATION-SAFE STATIC DATE FORMATTER (Option 1: Fixed UTC layout presentation) ───
function formatDateStatic(dateInput: Date | string) {
  const d = new Date(dateInput);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  
  let hours = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  
  return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm} UTC`;
}

// ─── MEMOIZE & SHIELD DATABASE QUERIES ACROSS PARALLEL NEXT.JS LIFECYCLES ───
const getArticleBySlug = cache(async (slug: string) => {
  return await prisma.article.findUnique({
    where: { slug },
    include: { author: true } 
  });
});

// ─── PRE-BUILD TOP HIGH-TRAFFIC ARTICLES TO SHIELD NEON DB AT LAUNCH ───
export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 500, 
    select: { slug: true },
  });

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// ─── DYNAMIC SEO METADATA FOR BROWSER & SOCIAL SHARE CARDS ───
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await getArticleBySlug(resolvedParams.slug);

  if (!article || !article.isPublished) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerosaga.com';

  return {
    metadataBase: new URL(siteUrl),
    title: `${article.title} | Aero Saga`,
    description: article.excerpt || `Read the full aviation dispatch: ${article.title}`,
    referrer: 'strict-origin-when-cross-origin',
    
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
      publishedTime: article.createdAt.toISOString(), 
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
  const article = await getArticleBySlug(resolvedParams.slug);

  if (!article || !article.isPublished) {
    notFound();
  }

  const relatedArticles = await prisma.article.findMany({
    where: {
      category: article.category,
      isPublished: true,
      NOT: { id: article.id }, 
    },
    orderBy: { createdAt: 'desc' },
    take: 6, 
    include: { author: true },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerosaga.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle', 
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
      'sameAs': article.author.sameAsLinks || [], 
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Aero Saga',
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

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <main className="lg:col-span-2">
          <Link href={`/category/${article.category.toLowerCase().replace(/\s+/g, '-')}`}>
            <span className="text-xs font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-2.5 py-1 rounded">
              {article.category}
            </span>
          </Link>
          <h1 className="article-title font-black text-slate-900 mt-4 mb-6 leading-tight tracking-tight text-3xl md:text-5xl">
            {article.title}
          </h1>

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
                    <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">{article.author.title}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Published: {formatDateStatic(article.createdAt)}
                {new Date(article.updatedAt).getTime() - new Date(article.createdAt).getTime() > 60000 && (
                  ` | Updated: ${formatDateStatic(article.updatedAt)}`
                )}
              </p>
            </div>
          </div>

          {article.imageUrl && (
            <div className="w-full h-100 bg-slate-50 rounded-2xl overflow-hidden mb-10 shadow-sm border border-slate-100">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                loading="eager" 
                decoding="async"
                className="w-full h-full object-cover object-center rounded-2xl"
              />
            </div>
          )}
          {/* ─── OPTIMIZED RENDERING CONTAINER: CONFINES PRE-WRAP STRUCTURAL SHIFTS STRICTLY TO TEXT PARAGRAPHS ─── */}
          <div 
            className="prose prose-slate max-w-none text-slate-800 leading-relaxed article-content font-serif tracking-normal
                       [&>p]:whitespace-pre-wrap
                       [&>p]:mb-6 [&>p]:mt-0 [&>p]:block
                       prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tight
                       prose-figure:my-8 prose-figure:mx-auto prose-figure:text-center prose-figure:w-full
                       prose-img:rounded-2xl prose-img:shadow-sm
                       prose-figcaption:text-xs prose-figcaption:text-slate-600 prose-figcaption:mt-3 prose-figcaption:italic prose-figcaption:font-sans prose-figcaption:tracking-wide prose-figcaption:text-center"
          >
            {/* ts-expect-error Async Server Component */}
            <RenderArticleContent html={article.content} />
          </div>

          <SocialShare title={article.title} slug={article.slug} />

          {article.author.bio && (
            <footer className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-3 font-sans">
              <h2 className="font-black text-xs uppercase tracking-widest text-blue-600">About the Author</h2>
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
                        if (rawBrand) {
                          dynamicLabel = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
                        }
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

          <div className="mt-8">
            <AirModelAffiliate variant="main" title="AirModel Picks" subtitle="Curated aviation models and display gear." />
          </div>
        </main>

        {/* ─── THE PERSISTENT VISUAL SIDEBAR COMPARTMENT ROW ─── */}
        <aside className="space-y-8 lg:col-span-1 lg:sticky lg:top-8 h-fit">
          
          {/* Most Read Component */}
          <MostReadList
            title="Most Read"
            titleClassName="font-black text-md text-slate-900 uppercase tracking-widest"
            containerClassName="bg-slate-50/70 border border-slate-100 p-5 rounded-xl"
            items={[
              { title: 'Emergency Landings on Highways in Florida', href: '/news/emergency-landings-on-highways-in-florida' },
              { title: 'She Survived 9/11 Only to Die on Flight 587 Two Months Later', href: '/news/she-survived-911-only-to-die-on-flight-587-two-months-later' },
              { title: 'American Airlines Accidents Statistics (1931 - 2025)', href: '/news/american-airlines-accidents-statistics-1931-2025' },
            ]}
          />

          {/* Flight Briefing Box */}
          <NewsletterForm />

          <AirModelAffiliate variant="sidebar" title="Sponsored Picks" subtitle="Gear picks for modern travelers." />
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
                      <Link href={`/news/${item.slug}`} prefetch={false}>
                        {item.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-bold text-slate-700">{item.author.name}</span>
                    <span>{formatDateStatic(item.createdAt)}</span>
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
