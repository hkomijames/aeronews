import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Navigation Links Grid */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8 text-sm font-medium tracking-wide">
          <Link href="/" className="hover:text-white transition-colors duration-200">
            Home
          </Link>
          <Link href="/about" className="hover:text-white transition-colors duration-200">
            About
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors duration-200">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors duration-200">
            Privacy
          </Link>
          <Link href="/sitemap.xml" className="hover:text-white transition-colors duration-200">
            Sitemap
          </Link>
          <Link href="/feed" className="hover:text-white transition-colors duration-200">
            RSS
          </Link>
        </div>

        {/* Separator Line */}
        <div className="border-t border-slate-900 my-6" />

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Aero Saga. All rights reserved.
          </p>
          <p className="hidden sm:block">
            Built with speed and privacy in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}
