import { NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import admin from 'firebase-admin';

// Allowlisted MIME types — reject anything not in this list
const ALLOWED_EXTENSIONS: Record<string, string> = {
  'jpg':  'image/jpeg',
  'jpeg': 'image/jpeg',
  'png':  'image/png',
  'webp': 'image/webp',
  'gif':  'image/gif',
  'mp3':  'audio/mpeg',
  'webm': 'audio/webm',
  'mp4':  'video/mp4',
  'mov':  'video/quicktime',
};

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function initFirebase() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          project_id: projectId,
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
        } as any),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    } else {
      console.warn('Firebase Admin credentials missing in upload API, using local mock/fallback only');
    }
  }
}

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

  // Validate file extension against allowlist
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const allowedMimeType = ALLOWED_EXTENSIONS[ext];
  if (!allowedMimeType) {
    return NextResponse.json(
      { error: `File type .${ext} is not permitted. Allowed: ${Object.keys(ALLOWED_EXTENSIONS).join(', ')}` },
      { status: 415 }
    );
  }

  // Check Content-Length header for early rejection before buffering
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 });
  }

  // Generate a clean, unique filename to prevent collisions
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFilename = `${Date.now()}-${cleanFilename}`;

  try {
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Initialize Firebase and explicitly target the storage bucket
      initFirebase();
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(`uploads/${uniqueFilename}`);

      // Use validated MIME type from the allowlist (already checked above)
      await file.save(buffer, {
        metadata: { contentType: allowedMimeType },
      });


      // Try to make it public via ACL (works on older buckets)
      try {
        await file.makePublic();
      } catch (aclError) {
        console.warn("Could not make public via ACL (likely UBLA enabled), relying on Signed URL.");
      }

      // Generate a long-lived signed URL (essentially permanent)
      const [publicUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2099', 
      });

      return NextResponse.json({
        url: publicUrl,
        downloadUrl: publicUrl,
        pathname: `uploads/${uniqueFilename}`,
        size: buffer.byteLength,
      });
    } catch (firebaseError: any) {
      console.warn("Firebase Storage upload failed, utilizing high-fidelity local fallback:", firebaseError?.message || firebaseError);
      
      const fs = require('fs');
      const path = require('path');

      // High-Fidelity Local Fallback: Save to public/uploads
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure the upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, uniqueFilename);
      fs.writeFileSync(filePath, buffer);
      
      return NextResponse.json({
        url: `/uploads/${uniqueFilename}`,
        downloadUrl: `/uploads/${uniqueFilename}`,
        pathname: `uploads/${uniqueFilename}`,
        size: buffer.byteLength,
      });
    }
  } catch (error: any) {
    console.error("Critical Upload Error:", error);
    return NextResponse.json({ error: 'Upload completely failed: ' + error.message }, { status: 500 });
  }
}
