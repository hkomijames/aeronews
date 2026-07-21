import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Update this object to include your new /public images
export const metadata: Metadata = {
  title: "Aero Saga",
  description: "Stay up to date with the latest airport and airplane news",
  icons: {
    icon: "/favicon.png",       // Points directly to /public/favicon.png
    apple: "/apple-touch-icon.png", // Points directly to /public/apple-touch-icon.png
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
