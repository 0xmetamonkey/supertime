const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function testUpload() {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')?.replace(/^"|"$/g, '')?.trim()?.replace(/\\+$/, '')?.trim(),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(`uploads/test-${Date.now()}.txt`);

    console.log("Attempting to upload to bucket:", bucketName);
    
    await file.save('Hello Firebase', {
      metadata: { contentType: 'text/plain' },
    });

    console.log("✅ Upload successful!");
    
    const [publicUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2099',
    });
    console.log("Signed URL:", publicUrl);

  } catch (error) {
    console.error("❌ Firebase Error:", error);
  }
}

testUpload();
