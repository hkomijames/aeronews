import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache'; // ─── IMPORT UNSTABLE_CACHE LAYER ───

// ─── STOP TIME-BASED REVALIDATION: CACHE INDEFINITELY AT THE GLOBAL EDGE CDN ───
// Converts your dynamic sitemap into a zero-overhead static asset on Vercel's Edge.
export const revalidate = false; 

// ─── BUNDLE SITEMAP LOOKUPS INTO A SINGLE ATOMIC DATA CACHE MATRIC ───
// Scoped globally outside the function handler so Next.js type registers the connection strings.
const getCachedSitemapData = unstable_cache(
  async () => {
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

    return { articles, categories };
  },
  ['sitemap-index-syndication-matrix'],
  { tags: ['stream-home'] } // ⚡ Cleared instantly whenever your admin actions update an article!
);

export async function GET() {
  try {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aerosaga.com').replace(/\/$/, '');

    // Pulls both datasets out of Vercel Edge Cache instantly, shielding Neon entirely
    const { articles, categories } = await getCachedSitemapData();

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
        // Instructs Vercel CDN to cache this generated template forever until on-demand eviction fires
        'Cache-Control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=60',
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
