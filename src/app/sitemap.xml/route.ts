import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';

export const revalidate = false;

const getCachedSitemapData = unstable_cache(
  async () => {
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
        category: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const categories = await prisma.article.findMany({
      where: {
        isPublished: true,
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return { articles, categories };
  },
  ['sitemap-index-syndication-matrix'],
  {
    tags: ['stream-home'],
  }
);

export async function GET() {
  try {
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || 'https://aerosaga.com'
    ).replace(/\/$/, '');

    const { articles, categories } = await getCachedSitemapData();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Homepage
    xml += `
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Category pages
    for (const { category } of categories) {
      if (!category) continue;

      const categorySlug = category
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      xml += `
  <url>
    <loc>${siteUrl}/category/${categorySlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Articles
    for (const article of articles) {
      const lastMod = new Date(article.updatedAt)
        .toISOString()
        .split('T')[0];

      xml += `
  <url>
    <loc>${siteUrl}/news/${article.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control':
          'public, max-age=0, s-maxage=31536000, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Sitemap generation failed:', error);

    return new NextResponse('', {
      status: 500,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  }
}