import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'; 
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
  // Automatically generates the proper openGraph tags, including your logo
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
  // Safe, structured JSON-LD schema for search engine branding
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
