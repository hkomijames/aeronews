import React, { useEffect, useRef } from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';

export const SocialEmbedComponent: React.FC<NodeViewProps> = ({ node }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawHtml = node.attrs.rawHtml || '';

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Strip out script tags to prevent DOM sanitization/execution exceptions
    const cleanHtml = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    containerRef.current.innerHTML = cleanHtml;

    // 2. Identify layout wrappers and invoke platform loading chains
    if (rawHtml.includes('twitter-tweet') || rawHtml.includes('x.com')) {
      loadScript('https://twitter.com', () => {
        (window as any).twttr?.widgets?.load(containerRef.current);
      });
    } 
    else if (rawHtml.includes('fb-root') || rawHtml.includes('facebook.com')) {
      loadScript('https://facebook.net', () => {
        (window as any).FB?.XFBML?.parse(containerRef.current);
      });
    } 
    else if (rawHtml.includes('reddit-embed') || rawHtml.includes('reddit.com')) {
      loadScript('https://reddit.com', () => {
        (window as any).rembeddit?.init();
      });
    }
  }, [rawHtml]);

  return (
    <NodeViewWrapper className="social-embed-node-block w-full my-6 clear-both">
      {/* Outer focus utility wrapper */}
      <div 
        ref={containerRef} 
        className="w-full flex justify-center bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-300 min-h-[100px] items-center" 
        contentEditable={false}
      />
    </NodeViewWrapper>
  );
};

// Global helper that safely single-mounts asynchronous platform widgets
function loadScript(src: string, callback: () => void): void {
  const existingScript = document.querySelector(`script[src="${src}"]`);
  if (existingScript) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.charset = 'utf-8';
  script.onload = callback;
  document.head.appendChild(script);
}
