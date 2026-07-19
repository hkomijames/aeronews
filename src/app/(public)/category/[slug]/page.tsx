import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Metadata } from 'next';
import PaginatedArticlesGrid from './components/PaginatedArticlesGrid';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ─── 1. CORRECTED DYNAMIC METADATA GENERATOR (WITH ABSOLUTE PRODUCTION CANONICALS) ───
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return {
    title: `${title} Desk | AV Newsroom`,
    description: `Stay updated with the latest breaking ${title.toLowerCase()} developments, expert editorial analysis, and aviation industry reports.`,
    alternates: { 
      // Fixed: Now points to your live absolute category address to clear index pollution blocks
      canonical: `https://vercel.app{slug}` 
    },
    openGraph: {
      title: `${title} Desk | AV Newsroom`,
      description: `Breaking reports and dynamic insights from the ${title.toLowerCase()} desk.`,
      url: `https://vercel.app{slug}`,
      siteName: 'Aero Saga',
      type: 'website',
    }
  };
}

export default async function DynamicCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const formattedCategoryTitle = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // LOADS EXACTLY 12 ARTICLES INITIALLY ON SERVERS
  const articles = await prisma.article.findMany({
    where: {
      category: {
        equals: formattedCategoryTitle,
        mode: 'insensitive',
      },
      isPublished: true,
    },
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 12,
  });

  if (articles.length === 0) {
    notFound();
  }

  // ─── 2. CORRECTED DYNAMIC JSON-LD STRUCTURAL SCHEMA DATA (REAL DOMAIN MATCHING) ───
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${formattedCategoryTitle} News Desk`,
    "description": `Aggregated coverage index of breaking reports concerning ${formattedCategoryTitle.toLowerCase()}.`,
    "url": `https://vercel.app{slug}`, // Fixed to direct domain route mapping
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "Aero Saga",
      "url": "https://aeronews.vercel.app",
      "logo": {
        "@type": "ImageObject",
        "url": "https://vercel.app"
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <div className="max-w-[80%] mx-auto">
        <header className="mb-12 border-b border-slate-800 pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Aviation Index Feed</span>
          <h1 className="text-4xl font-black tracking-tight text-white mt-1">{formattedCategoryTitle} Desk</h1>
        </header>

        {/* Passes server rows data down cleanly into our scrolling load container */}
        <PaginatedArticlesGrid 
          initialArticles={articles as any} 
          categoryName={formattedCategoryTitle} 
        />
      </div>
    </main>
  );
}
