import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aeronews.vercel.app').replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*', 
      allow: '/',     
      disallow: [
        '/_next/',    
        '/api/',      
        '/hq-portal',   // 🛡️ Completely blocks crawlers from indexing your portal dashboard
        '/hq-portal/',  // Catches any internal route paths down that directory tree
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
