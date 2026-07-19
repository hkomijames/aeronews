"use client";

import { useState } from 'react';

interface SocialShareProps {
  title: string;
  slug: string;
}

export default function SocialShare({ title, slug }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  // 1. Construct the production public path address
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aeronews.vercel.app';
  // Strip trailing slashes safely if present to avoid dual-slash errors
  const cleanSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  const fullUrl = `${cleanSiteUrl}/news/${slug}`;
  
  // 2. Format components for URL parameters safely
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(`${title} | AV Newsroom`);

  // 3. FIXED: Proper network intent routes using template literal variables
  const shareLinks = {
    twitter: `https://twitter.com${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://facebook.com${encodedUrl}`,
    linkedin: `https://linkedin.com${encodedUrl}`,
    whatsapp: `https://whatsapp.com${encodedTitle}%20${encodedUrl}`
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text string:', err);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2.5 py-4 border-y border-slate-100 my-6 font-sans">
      <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest mr-1">
        Share Coverage:
      </span>

      {/* Twitter / X - Premium Minimal Dark */}
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-black hover:scale-[1.03] transition-all duration-200 border border-slate-950 shadow-xs flex items-center justify-center"
        title="Share on X"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      {/* Facebook - Official Brand Blue */}
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-xl bg-[#1877F2] text-white hover:bg-[#145dbf] hover:scale-[1.03] transition-all duration-200 shadow-xs flex items-center justify-center"
        title="Share on Facebook"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z" />
        </svg>
      </a>

      {/* LinkedIn - Corporate Identity Blue */}
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-xl bg-[#0A66C2] text-white hover:bg-[#084d94] hover:scale-[1.03] transition-all duration-200 shadow-xs flex items-center justify-center"
        title="Share on LinkedIn"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      </a>

      {/* WhatsApp - High Visibility Mobile Green */}
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-xl bg-[#25D366] text-white hover:bg-[#1ebd56] hover:scale-[1.03] transition-all duration-200 shadow-xs flex items-center justify-center"
        title="Share on WhatsApp"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* Copy Link Button - Modern Textured Slate */}
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 ml-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all duration-200 border border-slate-200 shadow-xs cursor-pointer select-none"
        title="Copy link to clipboard"
      >
        <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
        {copied ? 'Copied Link!' : 'Copy Link'}
      </button>
    </div>
  );
}
