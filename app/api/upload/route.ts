import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request): Promise<NextResponse> {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  // Generate a clean, unique filename to prevent collisons and character encoding bugs
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFilename = `${Date.now()}-${cleanFilename}`;

  try {
    // 1. Try Vercel Blob first
    const bodyClone = request.clone();
    const blob = await put(uniqueFilename, bodyClone.body as ReadableStream, {
      access: 'public',
    });
    return NextResponse.json(blob);
  } catch (error: any) {
    console.warn("Vercel Blob upload failed, utilizing high-fidelity local fallback:", error?.message || error);
    
    try {
      // 2. High-Fidelity Local Fallback: Save to public/uploads
      const arrayBuffer = await request.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure the upload directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, buffer);
      
      // Return a Vercel-compatible Blob response shape so client code works flawlessly
      return NextResponse.json({
        url: `/uploads/${uniqueFilename}`,
        downloadUrl: `/uploads/${uniqueFilename}`,
        pathname: `uploads/${uniqueFilename}`,
        size: buffer.byteLength,
      });
    } catch (fallbackError: any) {
      console.error("Local fallback upload failed completely:", fallbackError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  }
}
