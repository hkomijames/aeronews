'use client';

import { useState } from 'react';
import { sendGAEvent } from '@next/third-parties/google';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // CHANGED: Swapped React.FormEvent for React.SubmitEvent to match React 19 standards
  const handleSubscribe = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Subscription failed.');

      sendGAEvent({ 
        event: 'newsletter_signup', 
        value: 'aviation_briefing' 
      });

      setStatus('success');
      setMessage('Welcome aboard! Check your inbox soon.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="bg-linear-to-br from-slate-900 to-slate-950 p-6 rounded-xl text-white shadow-lg border border-slate-800">
      <span className="text-xl">✉️</span>
      <h3 className="font-extrabold text-base mt-2">Aviation Newsletter</h3>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed mb-4">
        The latest aviation scoops, delivered straight to your inbox.
      </p>

      {status === 'success' ? (
        <div className="text-xs text-green-400 bg-green-950/50 border border-green-900 p-3 rounded-lg font-medium text-center">
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
          <input 
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email..." 
            required 
            disabled={status === 'loading'}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 disabled:opacity-50" 
          />
          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
          
          {status === 'error' && (
            <p className="text-[10px] text-red-400 mt-1 text-center font-medium">
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
