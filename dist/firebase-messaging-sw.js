importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 1. Initialize Firebase in the Service Worker
// REPLACE THESE VALUES WITH YOUR REAL FIREBASE CONFIG (Found in Project Settings)
firebase.initializeApp({
  apiKey: "AIzaSyCFi4LIpQBzs9QGnn4QQdNJtCvMOi_-VF8",
  authDomain: "spoilme-edee0.firebaseapp.com",
  projectId: "spoilme-edee0",
  storageBucket: "spoilme-edee0.appspot.com",
  messagingSenderId: "744288044885",
  appId: "1:744288044885:web:24614b67ffe485446151dc"
});

// 2. Retrieve Messaging
const messaging = firebase.messaging();

// Store user data
let userName = 'valued customer'; // Default fallback

// 3. Handle Messages from Main Thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'USER_DATA') {
    userName = event.data.name || 'valued customer';
    console.log('[firebase-messaging-sw.js] User name updated:', userName);
  }
});

// 4. Handle Background Messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationBody = payload.notification.body;

  // Replace placeholders with user data
  const personalizedTitle = notificationTitle.replace(/user|valued customer/gi, userName);
  const personalizedBody = notificationBody.replace(/user|valued customer/gi, userName);

  const notificationOptions = {
    body: personalizedBody,
    icon: payload.notification.image || '/pwa-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(personalizedTitle, notificationOptions);
});

// 5. Handle Notification Clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window open with this URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
