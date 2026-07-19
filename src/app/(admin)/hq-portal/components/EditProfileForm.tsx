"use client";

import { useState } from 'react';
import { updateUserProfile } from '../profile-actions'; // Verified Server Action pipeline connection

// ─── 1. TYPE CONTRACT DEFINITIONS FOR STRICT COMPILER COMPLIANCE ───
interface EditProfileFormProps {
  initialData: {
    name: string;
    title: string | null;
    bio: string | null;
    avatarUrl: string | null;
    sameAsLinks: string[];
  } | null;
}

export default function EditProfileForm({ initialData }: EditProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // States populated directly from server payload on mount - no background fetch 401 crashes!
  const [name, setName] = useState(initialData?.name || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || '');
  const [sameAsLinks, setSameAsLinks] = useState<string[]>(initialData?.sameAsLinks || []);

  // Uploads headshots straight to Vercel Blob cloud storage
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setSaving(true);
      const res = await fetch('/api/media', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setAvatarUrl(data.url);
      } else {
        alert('Cloud image processing rejected.');
      }
    } catch (err) {
      alert('Network issue streaming image.');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkChange = (index: number, value: string) => {
    const updatedLinks = [...sameAsLinks];
    updatedLinks[index] = value;
    setSameAsLinks(updatedLinks);
  };

  const addLinkField = () => setSameAsLinks([...sameAsLinks, '']);
  const removeLinkField = (index: number) => setSameAsLinks(sameAsLinks.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Calls the server action directly in a secure execution context
      const res = await updateUserProfile({ name, title, bio, avatarUrl, sameAsLinks });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || 'Update stream rejected.');
      }
    } catch (err) {
      setError('Network sync timeout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl mx-auto my-8 font-sans text-slate-100">
      <h2 className="text-xl font-bold tracking-tight text-white mb-1">Journalist Profile Blueprint</h2>
      <p className="text-xs text-slate-400 mb-6">Configure metadata structures to pass Google News E-E-A-T evaluation checks.</p>

      {error && <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 text-xs rounded-xl mb-4">{error}</div>}
      {success && <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs rounded-xl mb-4">✓ Profile database records updated successfully.</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Avatar Visual Section */}
        <div className="flex items-center space-x-4 p-4 bg-slate-950 rounded-xl border border-slate-800/50">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 shrink-0 overflow-hidden flex items-center justify-center relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-slate-500 font-medium">Headshot</span>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Journalist Avatar</label>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer" />
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Press Title / Role Descriptor</label>
            <input type="text" placeholder="e.g. Senior Aviation Correspondent" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-700" />
          </div>
        </div>

        {/* Journalist Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Professional Bio (Proof of Expertise)</label>
          <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-700 resize-none" placeholder="Provide background experience detail lines..." />
        </div>

        {/* Dynamic E-E-A-T Link Mapping Block */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-400">Authority Verification Links (sameAs Schema)</label>
            <button type="button" onClick={addLinkField} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">+ Add Link</button>
          </div>
          <div className="space-y-2">
            {sameAsLinks.map((link, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input type="url" placeholder="https://linkedin.com" value={link} onChange={(e) => handleLinkChange(idx, e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700" />
                <button type="button" onClick={() => removeLinkField(idx)} className="text-xs px-2.5 py-2 bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 rounded-xl transition-colors">✕</button>
              </div>
            ))}
            {sameAsLinks.length === 0 && <p className="text-xs text-slate-500 italic py-1">No reference footprints added yet.</p>}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 border-t border-slate-800/60">
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 font-semibold text-sm rounded-xl text-white transition-colors duration-200 disabled:opacity-50">
            {saving ? 'Synchronizing Profiles...' : 'Commit Profile Modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
