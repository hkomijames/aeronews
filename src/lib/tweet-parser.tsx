// src/lib/tweet-parser.tsx
import parse, { HTMLReactParserOptions, Element } from 'html-react-parser';
import { EmbeddedTweet } from 'react-tweet';
import { getTweet } from 'react-tweet/api';
import { unstable_cache } from 'next/cache';
import 'react-tweet/theme.css'; // Global core styling definitions 

// Secure server cache layer wrapping Twitter API 
export const getCachedTweet = unstable_cache(
  async (id: string) => {
    try {
      return (await getTweet(id)) || null;
    } catch (error) {
      console.error(`Error caching tweet ${id}:`, error);
      return null;
    }
  },
  ['static-article-tweets-v1'],
  { revalidate: 86400 } // Builds cache dynamically for on-demand ISR paths
);

function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/i);
  return match ? match[1] : null;
}

interface RenderEngineProps {
  html: string;
}

export async function RenderArticleContent({ html }: RenderEngineProps) {
  // Extract all Twitter/X link sequences from the raw markup
  const hrefMatches = html.match(/href="https?:\/\/(?:www\.)?(?:twitter|x)\.com\/\w+\/status\/(\d+)/gi) || [];
  const tweetIds = Array.from(new Set(hrefMatches.map(link => {
    const rawId = link.match(/\/status\/(\d+)/);
    return rawId ? rawId[1] : '';
  }).filter(Boolean)));

  // Batch pre-fetch all matching components in parallel during static generation lifecycle
  const tweetDataMap: Record<string, any> = {};
  await Promise.all(
    tweetIds.map(async (id) => {
      const data = await getCachedTweet(id);
      if (data) tweetDataMap[id] = data;
    })
  );

  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.name === 'a') {
        const href = domNode.attribs.href || '';
        const id = extractTweetId(href);

        if (id && tweetDataMap[id]) {
          return (
            // Override prose isolation cleanly so styling scales naturally inside light/dark grids
            <div className="my-8 not-prose flex justify-center w-full react-tweet-theme">
              <EmbeddedTweet tweet={tweetDataMap[id]} />
            </div>
          );
        }
      }
    },
  };

  return <>{parse(html, options)}</>;
}
