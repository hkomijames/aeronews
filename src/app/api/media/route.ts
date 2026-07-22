import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Imported to read your login sessions

// ─── 1. HANDLE UPLOADS (POST) ───
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // SECURITY CHECK: Read your secure login cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');

    // If the cookie doesn't exist, block the upload instantly
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
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
          addRandomSuffix: true, // Vercel handles making filenames unique automatically!
        };
      },
      onUploadCompleted: async ({ blob }) => {
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
    // SECURITY CHECK: Protect deletions using your login session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
