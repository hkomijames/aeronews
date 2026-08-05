import { list, copy, head } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { blobs } = await list();
    let updatedCount = 0;

    for (const blob of blobs) {
      // Check if it already has the 1-year max-age header
      const meta = await head(blob.url);
      
      if (!meta.cacheControl.includes('max-age=31536000')) {
        // Force Vercel to overwrite the exact same file in place with the new header
        await copy(blob.url, blob.url, {
          access: 'public',
          cacheControlMaxAge: 31536000,
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully forced 1-year cache on ${updatedCount} images directly in place.` 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
