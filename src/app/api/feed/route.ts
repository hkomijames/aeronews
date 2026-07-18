import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force Next.js to run this endpoint dynamically on every request to fetch fresh news instantly
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://avnewsroom.com';

    // 1. Fetch the 30 most recently published articles from PostgreSQL
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { author: true },
    });

    // 2. Build the structural XML header template compliant with Google News standards
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://w3.org" xmlns:content="http://purl.org">
  <channel>
    <title>AV Newsroom</title>
    <link>${siteUrl}</link>
    <description>Breaking tech news, deep-dives, and serverless infrastructure insights.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed" rel="self" type="application/rss+xml" />
`;

    // 3. Loop through individual articles and map them to structural RSS item tags
    for (const article of articles) {
      const articleUrl = `${siteUrl}/news/${article.slug}`;
      const pubDate = new Date(article.createdAt).toUTCString(); // Must use RFC 822 format

      // Clean up special xml string text escape constraints to prevent parsing feed drops
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

    // 5. Send raw text/xml header responses back to Google's crawling index bot
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 's-maxage=600, stale-while-revalidate', // Server caches data stream for 10 min
      },
    });

  } catch (error) {
    console.error("RSS syndication loop dropped:", error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><rss><channel><title>Error</title></channel></rss>', {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
