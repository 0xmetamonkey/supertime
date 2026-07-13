import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY
          .replace(/\\n/g, '\n')
          .replace(/^"|"$/g, '')
          .trim()
          .replace(/\\+$/, '')
          .trim()
      : undefined;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          project_id: process.env.FIREBASE_PROJECT_ID,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: privateKey,
        } as admin.ServiceAccount),
      });
    } else {
      console.warn('Firebase Admin credentials missing, skipping initialization');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const messaging = admin.apps.length ? admin.messaging() : null;
