/* eslint-disable no-undef */
// Source service worker for VitePWA injectManifest strategy
// This file will be processed and have the Workbox manifest injected as self.__WB_MANIFEST
import { precacheAndRoute } from 'workbox-precaching';

// Precache assets injected by workbox during build
precacheAndRoute(self.__WB_MANIFEST || []);

// Optional: claim clients and skip waiting on update messages
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Import Firebase messaging script (re-uses your public/firebase-messaging-sw.js logic)
// This allows one master service worker to handle both precaching and FCM background messages.
try {
  // If the public firebase-messaging-sw.js exists, import it into this worker's scope
  importScripts('/firebase-messaging-sw.js');
} catch (err) {
  // If import fails, log but continue
  console.warn('Could not import firebase-messaging-sw.js into master service worker', err);
}

// Example: add runtime caching for images
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images-cache', plugins: [] })
);

registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.json'),
  new StaleWhileRevalidate({ cacheName: 'json-cache' })
);
