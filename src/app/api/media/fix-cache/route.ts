import { list, copy } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Fetch all existing blobs in your cloud storage
    const { blobs } = await list();
    let updatedCount = 0;

    for (const blob of blobs) {
      // 2. Overwrite each file onto itself with the new cache header in the cloud
      await copy(blob.url, blob.pathname, {
        access: 'public',
        cacheControlMaxAge: 31536000, 
      });
      updatedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated cache headers for ${updatedCount} cloud images.` 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update existing images" }, { status: 500 });
  }
}
