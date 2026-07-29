// src/lib/tweet-parser.tsx
import parse, { HTMLReactParserOptions, Element } from 'html-react-parser';
import { EmbeddedTweet } from 'react-tweet';
import { getTweet } from 'react-tweet/api';
import { unstable_cache } from 'next/cache';
import 'react-tweet/theme.css'; 

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
  { revalidate: 86400 } 
);

function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/i);
  return match ? match[1] : null; // 💡 FIXED: Uses index 1 capture string safely
}

interface RenderEngineProps {
  html: string;
}

export async function RenderArticleContent({ html }: RenderEngineProps) {
  const hrefMatches = html.match(/href="https?:\/\/(?:www\.)?(?:twitter|x)\.com\/\w+\/status\/(\d+)/gi) || [];
  
  // 💡 FIXED: Extracts capture group string index 1 to satisfy the TypeScript compiler
  const tweetIds = Array.from(new Set(hrefMatches.map(link => {
    const rawId = link.match(/\/status\/(\d+)/);
    return rawId ? rawId[1] : ''; 
  }).filter(Boolean)));

  const tweetDataMap: Record<string, any> = {};
  await Promise.all(
    tweetIds.map(async (id) => {
      const data = await getCachedTweet(id);
      if (data) tweetDataMap[id] = data;
    })
  );

  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.name === 'p') {
        const anchorChild = domNode.children.find(
          (child) => child instanceof Element && child.name === 'a'
        ) as Element | undefined;

        if (anchorChild) {
          const href = anchorChild.attribs.href || '';
          const id = extractTweetId(href);

          if (id && tweetDataMap[id]) {
            return (
              <div className="my-8 not-prose flex justify-center w-full react-tweet-theme">
                <EmbeddedTweet tweet={tweetDataMap[id]} />
                <script dangerouslySetInnerHTML={{ __html: `
                  window.addEventListener('unhandledrejection', function(event) {
                    if (event.reason && event.reason.name === 'AbortError') {
                      event.preventDefault();
                    }
                  });
                `}} />
              </div>
            );
          }
        }
      }

      if (domNode instanceof Element && domNode.name === 'img') {
        if (!domNode.attribs.width || !domNode.attribs.height) {
          domNode.attribs.width = "800";
          domNode.attribs.height = "450";
        }
        // 💡 FORCE FIX: Removes layout-breaking tailwind classes on the fly
        domNode.attribs.class = (domNode.attribs.class || "").replace("h-100", "") + " !h-auto";
      }

      if (domNode instanceof Element && domNode.name === 'iframe') {
        const src = domNode.attribs.src || '';
        if (src.includes('youtube.com') || src.includes('youtube-nocookie.com')) {
          domNode.attribs.referrerpolicy = "strict-origin-when-cross-origin";
        }
      }
    },
  };

  return <>{parse(html, options)}</>;
}
