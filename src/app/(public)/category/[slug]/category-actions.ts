"use server";

import { prisma } from '@/lib/db';

export async function fetchMoreArticles(categoryName: string, skip: number, take: number = 6) {
  try {
    const articles = await prisma.article.findMany({
      where: {
        category: {
          equals: categoryName,
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
      skip: skip,
      take: take,
    });

    return { success: true, articles };
  } catch (error) {
    console.error("Pagination fetch failure:", error);
    return { success: false, articles: [] };
  }
}
