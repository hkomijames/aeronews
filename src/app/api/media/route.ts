import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Clean up spaces in filenames to maintain valid URLs
    const sanitizedFileName = file.name.replace(/\s+/g, '-');
    const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;

    // Upload directly to Vercel Blob Cloud Storage
    const blob = await put(uniqueFileName, file, {
      access: 'public', // Makes the file readable across the web
    });

    // Returns the live, globally accessible CDN URL (e.g., https://vercel-storage.com)
    return NextResponse.json({ success: true, url: blob.url });

  } catch (error) {
    console.error("Cloud upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
