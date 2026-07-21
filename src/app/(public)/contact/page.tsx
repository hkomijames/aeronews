import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-[80vh] bg-white font-sans text-slate-900 flex items-center py-16">
      <div className="max-w-md mx-auto px-4 text-center">
        <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase mb-3 block">
          Get In Touch
        </span>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 mb-4">
          Connect With Aero Saga
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-8">
          Have an aviation tip, corporate inquiry, or editorial feedback? Our channels are opening soon.
        </p>
        
        {/* Placeholder Interactive UI Container */}
        <div className="bg-slate-50/60 border border-slate-100 p-6 rounded-xl text-left mb-8">
          <div className="space-y-4 text-xs font-medium">
            <div>
              <span className="text-slate-400 block mb-0.5">Editorial Inquiries</span>
              <p className="text-slate-800 font-bold">press@aerosaga.com</p>
            </div>
          </div>
        </div>

        <Link 
          href="/" 
          className="text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors underline underline-offset-4"
        >
          Back to Home Page
        </Link>
      </div>
    </div>
  );
}
