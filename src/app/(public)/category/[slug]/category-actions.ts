"use server";

import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache'; // ─── NEW: Server memory caching engine

export async function fetchMoreArticles(categoryName: string, skip: number, take: number = 6) {
  try {
    // Standardize category tracking tags
    const cleanCategoryTag = categoryName.toLowerCase().replace(/\s+/g, '-');

    // ─── THE DATABASE SHIELD ENGINE ───
    // Wraps the Prisma query so Vercel remembers the response payload array
    const getCachedArticles = unstable_cache(
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
      [`articles-feed-${cleanCategoryTag}-skip-${skip}`], // Unique deterministic cache string identifier key
      {
        tags: [`category-${cleanCategoryTag}`, 'all-articles-feed'], // Cache purge tags
      }
    );

    // Call the wrapped cache engine
    const articles = await getCachedArticles(categoryName, skip, take);

    return { success: true, articles };
  } catch (error) {
    console.error("Pagination fetch failure:", error);
    return { success: false, articles: [] };
  }
}
