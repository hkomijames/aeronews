"use client";

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { compressImageForUpload } from '@/lib/optimize-image';

interface MediaSelectorProps {
  label: string;
  accept: string; // e.g., "image/*"
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
    const originalFile = files[0];

    try {
      const fileToUpload = await compressImageForUpload(originalFile);

      const newBlob = await upload(fileToUpload.name, fileToUpload, {
        access: 'public',
        handleUploadUrl: '/api/media',
      });

      if (newBlob && newBlob.url) {
        onUploadSuccess(newBlob.url); // Send the permanent live CDN URL back to the form state
      } else {
        alert('Media file upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error or compression crash communicating with file server storage.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset the file input so the same file can be selected again if needed
      }
    }
  }

  return (
    <div className="w-full bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">{label}</span>
      
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
          {uploading ? 'Processing & Uploading...' : '📁 Select Local File'}
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
