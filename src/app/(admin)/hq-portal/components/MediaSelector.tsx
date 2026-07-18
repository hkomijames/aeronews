"use client";

import { useState, useRef } from 'react';

interface MediaSelectorProps {
  label: string;
  accept: string; // e.g., "image/*" or "video/*"
  onUploadSuccess: (url: string) => void;
  currentUrl?: string;
}

export default function MediaSelector({ label, accept, onUploadSuccess, currentUrl }: MediaSelectorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]); // Pack your file selection

    try {
      // Send the file directly to your simplified API route
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        onUploadSuccess(result.url); // Send the permanent /media/... path back to the form state
      } else {
        alert(result.error || 'Media file upload failed.');
      }
    } catch (err) {
      alert('Network error communicating with file server storage.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-full bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">{label}</span>
      
      {/* Hidden native system input element */}
      <input 
        type="file" 
        accept={accept} 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <div className="flex gap-3 items-center">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading Asset...' : '📁 Select Local File'}
        </button>
        
        {currentUrl ? (
          <span className="text-[11px] text-emerald-400 truncate flex-1 font-mono">{currentUrl}</span>
        ) : (
          <span className="text-[11px] text-slate-500 italic">No file chosen from your PC</span>
        )}
      </div>
    </div>
  );
}
