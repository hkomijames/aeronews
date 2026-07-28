import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Enforce critical CSS inlining to eliminate render-blocking network chunks */
  experimental: {
    inlineCss: true,
  },
  
  async rewrites() {
    return [
      {
        source: '/feed',           // The clean URL for Google News and RSS readers
        destination: '/api/feed',  // The path to your cached API route handler
      },
    ];
  },
};

export default nextConfig;
