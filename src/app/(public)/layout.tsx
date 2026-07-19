import dynamic from 'next/dynamic';

// ─── 1. EXTRACTED SKELETON OUT TO A PURE COMPONENT PIECE ───
// This isolates the JSX parsing context entirely, clearing lines 15-18 errors.
function NavbarSkeleton() {
  return (
    <div className="w-full bg-white h-[73px] border-b border-slate-100 flex items-center px-8 animate-pulse">
      <div className="w-32 h-6 bg-slate-200 rounded" />
      <div className="hidden md:flex ml-auto gap-6">
        <div className="w-16 h-4 bg-slate-100 rounded" />
        <div className="w-16 h-4 bg-slate-100 rounded" />
        <div className="w-16 h-4 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

// ─── 2. LAZY LOAD IMPORT CALL WITH THE CLEAN ELEMENT HOOKED UP ───
const LazyNavbar = dynamic(() => import('./components/Navbar'), {
  ssr: false,
  loading: NavbarSkeleton
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <LazyNavbar />
      <main>
        {children}
      </main>
    </div>
  );
}
