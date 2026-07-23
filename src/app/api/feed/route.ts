import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache'; // ─── IMPORT UNSTABLE_CACHE LAYER ───

// ─── STOP TIME-BASED REVALIDATION: CACHE INDEFINITELY AT THE GLOBAL EDGE CDN ───
// This forces Vercel to save the XML file as a static file, shielding Neon entirely.
export const revalidate = false; 

// ─── SEAL INDIVIDUAL DATA RETRIEVAL INTO THE GLOBAL PIPELINE TAG ───
// Declared outside the function scope so Next.js indexes connection strings correctly.
const getCachedFeedArticles = unstable_cache(
  async () => {
    return await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { author: true },
    });
  },
  ['rss-syndication-feed-matrix'],
  { tags: ['stream-home'] } // ⚡ Shared with your homepage tag for instant, zero-cost eviction!
);

export async function GET() {
  try {
    // Ensure standard production fallback URL ends cleanly without an accidental double slash later
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aerosaga.com').replace(/\/$/, '');

    // Reads directly from Vercel Edge memory cache instead of opening a raw Prisma query pool
    const articles = await getCachedFeedArticles();

    // Determine the latest build date based on the newest article, fallback to current time if empty
    const latestArticleDate = articles.length > 0 ? new Date(articles[0].createdAt) : new Date();

    // 2. Build structural XML template with valid Google News & W3C validation namespaces
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://w3.org" xmlns:content="http://purl.org">
  <channel>
    <title>Aero Saga</title>
    <link>${siteUrl}</link>
    <description>Breaking aero news, aiport and airplane news.</description>
    <language>en-us</language>
    <lastBuildDate>${latestArticleDate.toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed" rel="self" type="application/rss+xml" />
`;
    // 3. Loop through individual articles and map them to structural RSS item tags
    for (const article of articles) {
      const articleUrl = `${siteUrl}/news/${article.slug}`;
      const pubDate = new Date(article.createdAt).toUTCString(); // Standard RFC 822 format

      // Clean up special XML text characters to prevent syntax validation drops
      const escapeXml = (str: string) => 
        str.replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&apos;');

      xml += `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(article.excerpt || article.title)}</description>
      <category>${escapeXml(article.category)}</category>
      <author>${escapeXml(article.author.email)} (${escapeXml(article.author.name)})</author>
      <content:encoded><![CDATA[${article.content}]]></content:encoded>
    </item>\n`;
    }

    // 4. Seal the structural stream block closure
    xml += `  </channel>
</rss>`;

    // 5. Send optimized text/xml response back to Google's crawling index bot
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        // Combined edge caching configuration to match our permanent static profile setup
        'Cache-Control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=60', 
      },
    });

  } catch (error) {
    console.error("RSS syndication loop dropped:", error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><rss><channel><title>Error</title></channel></rss>', {
      status: 500,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
