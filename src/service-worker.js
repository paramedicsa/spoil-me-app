/* eslint-disable no-undef */
// Source service worker for VitePWA injectManifest strategy
// This file will be processed and have the Workbox manifest injected as self.__WB_MANIFEST
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// 1) Workbox precache (assets injected at build time)
precacheAndRoute(self.__WB_MANIFEST || []);

// 2) Standard SW lifecycle helpers (allow skip waiting via message)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 3) Runtime caching examples
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images-cache', plugins: [] })
);

registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.json'),
  new StaleWhileRevalidate({ cacheName: 'json-cache' })
);

// 4) Firebase Messaging inline (compat imports via CDN)
try {
  importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

  // Build-time injected environment variables (Vite) — keep keys out of source
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };

  // Initialize Firebase only if config appears valid
  if (firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey) {
    try {
      firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();

      // Keep user data for personalization
      let userName = 'valued customer';
      self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'USER_DATA') {
          userName = event.data.name || 'valued customer';
          console.debug('[sw] USER_DATA received in SW:', userName);
        }
        // Allow SKIP_WAITING messages to pass through
        if (event.data && event.data.type === 'SKIP_WAITING') {
          self.skipWaiting();
        }
      });

      // Background message handler
      messaging.onBackgroundMessage((payload) => {
        try {
          const notificationTitle = (payload?.notification?.title) || 'Notification';
          const notificationBody = (payload?.notification?.body) || '';
          const personalizedTitle = notificationTitle.replace(/user|valued customer/gi, userName);
          const personalizedBody = notificationBody.replace(/user|valued customer/gi, userName);
          const notificationOptions = {
            body: personalizedBody,
            icon: payload?.notification?.image || '/pwa-192x192.png',
            data: payload?.data || {}
          };
          self.registration.showNotification(personalizedTitle, notificationOptions);
        } catch (err) {
          console.warn('onBackgroundMessage handler failed:', err);
        }
      });

      // Handle notification clicks
      self.addEventListener('notificationclick', function(event) {
        event.notification.close();
        const urlToOpen = event.notification.data?.url || '/';
        event.waitUntil(
          clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
              var client = windowClients[i];
              if (client.url === urlToOpen && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
          })
        );
      });
    } catch (firebaseInitErr) {
      console.warn('Firebase init failed in service worker:', firebaseInitErr);
    }
  } else {
    console.warn('Firebase config not provided to service worker (VITE_FIREBASE_* env vars).');
  }
} catch (err) {
  console.warn('Could not load Firebase scripts in service worker', err);
}
