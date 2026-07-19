import dynamic from 'next/dynamic'; // INJECTED FOR LAZY LOADING

// ─── LAZY LOADED BUNDLE SPLIT ───
// This pulls the entire Navbar out of the critical rendering path bundle
const LazyNavbar = dynamic(() => import('./components/Navbar'), {
  ssr: false, // Prevents loading during initial server-side evaluation passes
  // A clean, newsroom-styled skeleton fallback placeholder while the chunk streams down
  loading: () => (
    <div className="w-full bg-white h-[73px] border-b border-slate-100 flex items-center px-8 animate-pulse">
      <div className="w-32 h-6 bg-slate-200 rounded" />
      <div className="hidden md:flex ml-auto gap-6">
        <div className="w-16 h-4 bg-slate-100 rounded" />
        <div className="w-16 h-4 bg-slate-100 rounded" />
        <div className="w-16 h-4 bg-slate-100 rounded" />
      </div>
    </div>
  )
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Renders the lazy loaded chunk container implicitly on client mount */}
      <LazyNavbar />
      <main>
        {children}
      </main>
    </div>
  );
}
