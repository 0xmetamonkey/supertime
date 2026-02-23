importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Config will be injected by the app or we can fetch it
// For now, we assume keys are available or hardcoded if needed, 
// but preferred to use environment variables in the build process if possible.
// Because SW is static, we might need a dynamic way to pass config or just hardcode it here.

firebase.initializeApp({
  apiKey: "AIzaSyArNzoCmOfKHZIPhy-Jx-CTq5RVm0578QY",
  authDomain: "supertime-b9ac2.firebaseapp.com",
  projectId: "supertime-b9ac2",
  storageBucket: "supertime-b9ac2.firebasestorage.app",
  messagingSenderId: "502678672221",
  appId: "1:502678672221:web:1cdf1eff1a351933004eb4",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  if (payload.data && payload.data.action === 'cancel-call') {
    console.log('[firebase-messaging-sw.js] Dismissing active call notification');
    self.registration.getNotifications({ tag: 'incoming-call' }).then(notifications => {
      notifications.forEach(notification => notification.close());
    });
    return;
  }

  const notificationTitle = payload.notification?.title || 'Incoming Call';
  const notificationOptions = {
    body: payload.notification?.body || 'Someone is calling you...',
    icon: '/logo.png', // Replace with your logo
    badge: '/badge.png', // Replace with your badge
    tag: 'incoming-call',
    data: payload.data,
    renotify: true,
    requireInteraction: true,
    actions: [
      {
        action: 'answer',
        title: 'Answer',
        icon: '/check.png'
      },
      {
        action: 'reject',
        title: 'Reject',
        icon: '/x.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'answer') {
    const callData = event.notification.data;
    // Redirect to the main studio or creator page
    // The signaling hook will pick up the active call on mount via URL params
    const path = (callData.action === 'incoming-call' && callData.to) ? `/${callData.to}` : '/studio';
    const urlToOpen = new URL(`${path}?call_channel=${callData.channelName}&call_type=${callData.type}`, self.location.origin).href;
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});
