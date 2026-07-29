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
          <p className="text-xs text-slate-600 font-medium">
            Last modified: July 21, 2026
          </p>
        </div>

        {/* Content Layout */}
        <div className="space-y-6 text-sm text-slate-600 leading-relaxed mb-10">
          <p className="font-semibold text-slate-900">
            We value your privacy. This page explains how we count visitors on Aero Saga.
          </p>
          <p>
            We use Google Analytics to study website traffic. This tool places small files called cookies on your computer. These cookies count visits and see which airplane news articles you read. 
          </p>
          <p>
            This data is completely anonymous. It does not look at your personal details. It cannot see your name, email, or physical address. And it will not track you across the rest of the web.
          </p>
          <div className="bg-slate-50/60 border border-slate-100 p-5 rounded-xl text-xs space-y-3">
            <h3 className="font-bold text-slate-950 uppercase tracking-wider">Your Controls:</h3>
            <p>You can change how we track your visit at any time:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Block tracking via our home page cookie banner.</li>
              <li>Turn off cookies directly in your browser settings.</li>
              <li>Use the official Google Analytics opt-out extension.</li>
            </ul>
          </div>
          <p>
            We only use this data to pick better aviation topics for the blog. And we never sell your information to advertisers. If you have questions about this, please reach out to our team.
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
