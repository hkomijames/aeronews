import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Metadata } from 'next';
import PaginatedArticlesGrid from './components/PaginatedArticlesGrid'; // 👈 IMPORT THE CONTAINER

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return {
    title: `${title} Desk | AV Newsroom`,
    description: `Stay updated with the latest breaking ${title.toLowerCase()} developments.`,
    alternates: { canonical: `https://vercel.app{slug}` }
  };
}

export default async function DynamicCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const formattedCategoryTitle = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // ─── OPTIMIZED: LOADS EXACTLY 12 ARTICLES INITIALLY ON SERVERS ───
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
    take: 12, // 👈 ENFORCE THE 12 COUNT LIMIT HERE
  });

  if (articles.length === 0) {
    notFound();
  }

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${formattedCategoryTitle} News Desk`,
    "description": `Aggregated coverage index of breaking reports concerning ${formattedCategoryTitle.toLowerCase()}.`,
    "url": `https://vercel.app{slug}`,
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

        {/* 🚀 REPLACED: Passes server rows data down cleanly into our scrolling load container */}
        <PaginatedArticlesGrid 
          initialArticles={articles as any} 
          categoryName={formattedCategoryTitle} 
        />
      </div>
    </main>
  );
}
