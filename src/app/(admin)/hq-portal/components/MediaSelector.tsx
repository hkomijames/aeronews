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
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
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

  function openUrlModal() {
    setImageUrlInput('');
    setImageAltInput('');
    setImageCaptionInput('');
    setShowUrlModal(true);
  }

  function closeUrlModal() {
    setShowUrlModal(false);
    setImageUrlInput('');
    setImageAltInput('');
    setImageCaptionInput('');
  }

  function handleUrlSubmit() {
    const trimmedUrl = imageUrlInput.trim();
    const trimmedAlt = imageAltInput.trim();

    if (!trimmedUrl) {
      alert('Image URL is required.');
      return;
    }

    if (!trimmedAlt) {
      alert('Alt text is required.');
      return;
    }

    try {
      new URL(trimmedUrl, window.location.origin);
    } catch {
      alert('Please enter a valid image URL.');
      return;
    }

    // Remote URLs are stored as-is and are not uploaded to Vercel Blob.
    // Only local file selections use the blob upload pipeline.
    onUploadSuccess(trimmedUrl);
    closeUrlModal();
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Processing & Uploading...' : '📁 Select Local File'}
        </button>

        <button
          type="button"
          onClick={openUrlModal}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-700 transition-colors"
        >
          🔗 Upload via URL
        </button>
        
        {currentUrl ? (
          <span className="text-[11px] text-emerald-400 truncate flex-1 font-mono">{currentUrl}</span>
        ) : (
          <span className="text-[11px] text-slate-500 italic">No file chosen from your PC</span>
        )}
      </div>

      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">Use an image URL for the cover</h3>
              <p className="mt-1 text-xs text-slate-400">Remote image URLs are stored directly; only local files are uploaded to Vercel Blob.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Image URL</label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(event) => setImageUrlInput(event.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Alt Text</label>
                <input
                  type="text"
                  value={imageAltInput}
                  onChange={(event) => setImageAltInput(event.target.value)}
                  placeholder="Descriptive alt text"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Caption (Optional)</label>
                <input
                  type="text"
                  value={imageCaptionInput}
                  onChange={(event) => setImageCaptionInput(event.target.value)}
                  placeholder="Optional caption"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeUrlModal}
                className="rounded bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Save Cover Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
