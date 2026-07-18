import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // Stream directly using arrayBuffer and write cleanly into public/media
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    const mediaDir = path.join(process.cwd(), 'public', 'media');
    await fs.mkdir(mediaDir, { recursive: true });

    await fs.writeFile(path.join(mediaDir, fileName), buffer);
    return NextResponse.json({ success: true, url: `/media/${fileName}` });

  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
