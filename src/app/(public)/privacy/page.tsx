import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-[80vh] bg-white font-sans text-slate-900 py-16">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-6 mb-8">
          <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase mb-2 block">
            Legal Compliance
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Last modified: July 21, 2026
          </p>
        </div>

        {/* Content Layout */}
        <div className="space-y-6 text-sm text-slate-600 leading-relaxed mb-10">
          <p className="font-semibold text-slate-900">
            At Aero Saga, accessible from our public web portal, safeguarding the data privacy of our global aviation readers is an absolute operational priority.
          </p>
          <p>
            This operational document outlines the specific types of identity profiles or browser telemetry records gathered and managed by our secure infrastructure layers.
          </p>
          <div className="bg-slate-50/60 border border-slate-100 p-5 rounded-xl text-xs space-y-3">
            <h3 className="font-bold text-slate-950 uppercase tracking-wider">Forthcoming Updates:</h3>
            <p>Our upcoming framework expansion will explicitly detail:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Log File Analytics & IP routing tracking structures</li>
              <li>Browser Cookie caching boundaries</li>
              <li>Third-party script integration controls</li>
            </ul>
          </div>
          <p>
            If you have additional validation inquiries or require structural clarification regarding our local metadata retention guidelines, do not hesitate to contact our desk.
          </p>
        </div>

        {/* Action Button */}
        <Link 
          href="/" 
          className="inline-flex items-center bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          ← Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
