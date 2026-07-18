"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../auth-actions'; // Clean relative path import

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Call your server action directly
    const result = await loginUser(email, password);

    if (result.success) {
      // Redirect straight to your hq-portal workspace route
      router.push('/hq-portal');
      router.refresh();
    } else {
      setError(result.error || 'Authentication failed.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-500">AV Newsroom Engine</span>
          <h1 className="text-2xl font-black text-white mt-1">Staff Portal Login</h1>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-xs p-3 rounded-lg mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Corporate Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Secret Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Verifying Identity...' : 'Access Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
