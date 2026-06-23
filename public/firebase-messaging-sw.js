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

  const type = payload.data?.type || 'incoming-call';
  const notificationTitle = payload.notification?.title || 'Supertime';
  const body = payload.notification?.body || 'You have a new notification';

  let notificationOptions = {
    body,
    icon: '/icon.png', 
    badge: '/icon.png', 
    data: payload.data,
    renotify: true,
    requireInteraction: true,
  };

  if (type === 'chat-message') {
    notificationOptions.tag = 'chat-message';
    notificationOptions.actions = [
      {
        action: 'reply',
        title: 'Reply'
      }
    ];
  } else {
    // Incoming Call Default
    notificationOptions.tag = 'incoming-call';
    notificationOptions.actions = [
      {
        action: 'answer',
        title: 'Answer'
      },
      {
        action: 'reject',
        title: 'Reject'
      }
    ];
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  
  if (data.type === 'chat-message' || event.action === 'reply') {
    // Open the chat tab
    const toUser = data.from ? `&to=${encodeURIComponent(data.from)}` : '';
    const urlToOpen = new URL(`/dashboard?tab=inbox${toUser}`, self.location.origin).href;
    event.waitUntil(clients.openWindow(urlToOpen));
    return;
  }
  
  if (event.action === 'answer' || (!event.action && data.type === 'incoming-call')) {
    // Redirect to the main studio or creator page
    const path = (data.action === 'incoming-call' && data.to) ? `/${data.to}` : '/studio';
    const urlToOpen = new URL(`${path}?call_channel=${data.channelName}&call_type=${data.type}`, self.location.origin).href;
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});
