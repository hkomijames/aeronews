// app/api/media/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

// ─── 1. HANDLE UPLOADS (POST) ───
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Clean up spaces in filenames to maintain valid URLs
        const sanitizedFileName = pathname.replace(/\s+/g, '-');
        const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;

        return {
          allowedContentTypes: [
            'image/jpeg', 
            'image/png', 
            'image/webp', 
            'video/mp4', 
            'video/quicktime', 
            'video/webm'
          ],
          maximumSizeInBytes: 150 * 1024 * 1024, // 150MB file limit
          addRandomSuffix: true,
          // FIX: clientPayload keeps chunk authorization stable for videos
          clientPayload: JSON.stringify({ uniqueFileName }), 
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('File successfully written to cloud:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Cloud upload security error:", error);
    return NextResponse.json(
      { error: "Token generation failed" },
      { status: 400 },
    );
  }
}

// ─── 2. HANDLE UNMOUNT CLEANUP DELETIONS (DELETE) ───
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: "Missing blob URL asset parameter" }, { status: 400 });
    }
    
    // Deletes tracking target directly out of Vercel storage
    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete orphaned blob item:", error);
    return NextResponse.json(
      { error: "Asset deletion request failed" },
      { status: 500 }
    );
  }
}
