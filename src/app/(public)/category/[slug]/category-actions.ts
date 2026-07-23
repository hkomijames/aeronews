"use server";

import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';

// ─── CRITICAL NEON SLEEP FIX: DECLARE THE CACHE LAYER GLOBALLY ───
// This must sit outside the function block so Next.js compiles the connection pooler paths correctly.
// We remove 'skip' from the cache key and pass it as an argument so Next.js handles parameters natively.
const getCachedArticlesFeed = unstable_cache(
  async (catName: string, offset: number, limit: number) => {
    return await prisma.article.findMany({
      where: {
        category: {
          equals: catName,
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
      skip: offset,
      take: limit,
    });
  },
  ['articles-feed-global-paginated-matrix'], // Fixed static key descriptor
  {
    // Tags remain completely compatible with your existing server actions eviction matrix
    tags: ['all-articles-feed'] 
  }
);
export async function fetchMoreArticles(categoryName: string, skip: number, take: number = 6) {
  try {
    // Call the globally scoped cache engine, passing down your arguments natively.
    // This allows Vercel to index parameters perfectly without fragmenting cache records on the edge.
    const articles = await getCachedArticlesFeed(categoryName, skip, take);

    return { success: true, articles };
  } catch (error) {
    console.error("Pagination fetch failure:", error);
    return { success: false, articles: [] };
  }
}
