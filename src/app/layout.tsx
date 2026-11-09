import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'; 
import Script from "next/script"; // Import the Next.js optimized script component
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aero Saga",
  description: "Stay up to date with the latest airport and airplane news",
  icons: {
    icon: "/favicon.png",       
    apple: "/apple-touch-icon.png", 
  },
  openGraph: {
    siteName: "Aero Saga",
    title: "Aero Saga",
    description: "Stay up to date with the latest airport and airplane news",
    url: "https://aerosaga.com",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Aero Saga Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Aero Saga',
    'url': 'https://aerosaga.com'
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 
          1. OPTIMIZED TERMLY SCRIPT LOADING
          Using 'beforeInteractive' forces the Auto-Blocker engine to execute 
          at the absolute top of the DOM tree, safely halting tracking scripts until user opt-in.
        */}
        <Script 
          id="termly-cmp"
          src="https://app.termly.io/resource-blocker/72d9ffd7-4627-41c6-a33f-771040a4d242?autoBlock=on"
          strategy="beforeInteractive"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}

        {/* 
          2. MOVE PREFERENCES ANCHOR INSIDE BODY
          Placing this at the bottom of the body keeps your HTML structure 
          clean and completely standard for AdSense bots. You can style this using Tailwind.
        */}
        <div className="fixed bottom-4 left-4 z-40 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors duration-200">
          <a href="#" className="termly-display-preferences">Consent Preferences</a>
        </div>

        {/* 
          3. GA4 TRACKING INITIALIZATION
          Now perfectly sandboxed within the body wrapper.
        */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
