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
      // 1. Intercept the paragraph tag instead of the link tag
      if (domNode instanceof Element && domNode.name === 'p') {
        // Look through the children of the paragraph for the anchor tag
        const anchorChild = domNode.children.find(
          (child) => child instanceof Element && child.name === 'a'
        ) as Element | undefined;

        if (anchorChild) {
          const href = anchorChild.attribs.href || '';
          const id = extractTweetId(href);

          // If it matches a valid, cached tweet, replace the ENTIRE paragraph node
          if (id && tweetDataMap[id]) {
            return (
              <div className="my-8 not-prose flex justify-center w-full react-tweet-theme">
                <EmbeddedTweet tweet={tweetDataMap[id]} />
              </div>
            );
          }
        }
      }
    },
  };

  return <>{parse(html, options)}</>;
}
