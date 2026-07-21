import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-[80vh] bg-white font-sans text-slate-900 flex items-center py-16">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase mb-3 block">
          Our Mission
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 mb-6">
          Chronicling the Skies.
        </h1>
        <div className="w-12 h-1 bg-slate-950 mx-auto mb-8 rounded-full" />
        <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto">
          Welcome to Aero Saga. This page is currently preparing for take-off. Soon, you will find our complete company profile, operational histories, and news desk details here.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-lg transition-colors shadow-md"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
