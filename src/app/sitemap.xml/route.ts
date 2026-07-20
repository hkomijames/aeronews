import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ─── AGGRESSIVE COST REDUCTION: CACHE SITEMAP FOR 1 HOUR AT THE CDN EDGE ───
// This shields your Neon DB. Crawlers get cached static XML instantly.
export const revalidate = 3600; 

export async function GET() {
  try {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aeronews.vercel.app').replace(/\/$/, '');

    // 1. Fetch only the core required fields for articles to minimize database payload size
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        updatedAt: true,
        category: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Fetch unique categories to generate index listings dynamically
    const categories = await prisma.article.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    });

    // 3. Initialize the XML structural map with index-critical core priority URLs
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://sitemaps.org">
  <!-- Homepage -->
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // 4. Inject Dynamic Category Index Pages
    for (const cat of categories) {
      const catSlug = cat.category.toLowerCase().replace(/\s+/g, '-');
      xml += `  <url>
    <loc>${siteUrl}/category/${catSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    }

    // 5. Inject Dynamic Article Deep-Links
    for (const article of articles) {
      const articleUrl = `${siteUrl}/news/${article.slug}`;
      const lastMod = new Date(article.updatedAt).toISOString().split('T')[0]; // Format as YYYY-MM-DD

      xml += `  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    }

    // 6. Seal the structural node block closure
    xml += `</urlset>`;

    // 7. Return standard compliant content header back to search indexing bots
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error("Sitemap syndication loop dropped:", error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://sitemaps.org"></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
