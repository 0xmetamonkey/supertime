import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

let app;
let messaging: Messaging | null = null;

if (hasFirebaseConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (typeof window !== "undefined") {
      messaging = getMessaging(app);
    }
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

export { app, messaging };

export const requestForToken = async () => {
  try {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission not granted.");
        return null;
      }
    }

    if (!messaging) {
      console.warn("Firebase messaging is not initialized (missing config).");
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
