"use client";

import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { upload } from '@vercel/blob/client'; // Import Vercel's secure direct-upload tool

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
    const originalFile = files[0];

    try {
      let fileToUpload: File = originalFile;

      // Only run optimization if the file is an image
      if (originalFile.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.2,          // Forces target file size under 200KB
          maxWidthOrHeight: 1200,  // Automatically resizes massive width bounds
          useWebWorker: true,
          fileType: 'image/webp'   // Changes format container type to optimized WebP
        };

        // 1. Run local client device compression engine
        const compressedBlob = await imageCompression(originalFile, options);

        // 2. Wrap blob container into a virtual File structure with .webp suffix extension
        const cleanName = originalFile.name.replace(/\.[^/.]+$/, "");
        fileToUpload = new File([compressedBlob], `${cleanName}.webp`, {
          type: 'image/webp',
        });
      }

      // 3. Directly stream the file from the browser straight to Vercel Blob cloud bucket
      const newBlob = await upload(fileToUpload.name, fileToUpload, {
        access: 'public',
        handleUploadUrl: '/api/media',
        multipart: originalFile.type.startsWith('video/'), // Enables multi-part streaming specifically for video assets
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
